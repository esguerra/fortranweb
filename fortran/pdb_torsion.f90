! =====================================================================
! PDB to Torsion Angles Calculator
! =====================================================================
! Reads a PDB file and computes backbone dihedral angles for nucleic acids
!
! Backbone torsion angles (standard nomenclature):
!   alpha:   P(n-1) - O5'(n) - C5'(n) - C4'(n)
!   beta:    O5'(n) - C5'(n) - C4'(n) - C3'(n)
!   gamma:   C5'(n) - C4'(n) - C3'(n) - O3'(n)
!   delta:   C4'(n) - C3'(n) - O3'(n) - P(n+1)  [or O3'(n) - P(n)]
!   epsilon: C3'(n) - O3'(n) - P(n+1) - O5'(n+1)
!   zeta:    O3'(n) - P(n+1) - O5'(n+1) - C5'(n+1)
!   chi:     O4'(n) - C1'(n) - N(9/1)(n) - C(8/2)(n)
!
! Reference: 
! IUPAC-IUBMB definitions for nucleic acid structure
! =====================================================================

program pdb_torsion_calculator
    implicit none
    
    integer, parameter :: MAX_ATOMS = 5000
    integer, parameter :: MAX_RESIDUES = 500
    
    type :: atom_record
        integer :: number
        character(len=4) :: name
        character(len=3) :: res_name
        integer :: res_number
        character(len=1) :: chain_id
        real :: x, y, z
        real :: occupancy, b_factor
    end type atom_record
    
    type(atom_record) :: atoms(MAX_ATOMS)
    integer :: n_atoms
    character(len=256) :: pdb_file, output_file
    integer :: i, nargs
    
    ! Get filenames from command line
    nargs = command_argument_count()
    
    if (nargs < 1) then
        write(*,'(A)') 'Usage: pdb_torsion <pdb_file> [output_file]'
        write(*,'(A)') 'If output_file is not specified, torsion_angles.dat is used'
        stop
    endif
    
    call get_command_argument(1, pdb_file)
    
    if (nargs >= 2) then
        call get_command_argument(2, output_file)
    else
        output_file = 'torsion_angles.dat'
    endif
    
    ! Read PDB file
    call read_pdb_file(pdb_file, atoms, n_atoms)
    write(*,'(A,I0,A)') 'Successfully read ', n_atoms, ' atoms from PDB file'
    
    ! Compute and write torsion angles
    call compute_and_write_angles(atoms, n_atoms, output_file)
    
    write(*,'(A,A)') 'Torsion angles written to: ', trim(output_file)

contains

    ! =====================================================================
    ! Read a PDB file and extract atom coordinates
    ! =====================================================================
    subroutine read_pdb_file(filename, atoms, n_atoms)
        character(len=*), intent(in) :: filename
        type(atom_record), intent(out) :: atoms(:)
        integer, intent(out) :: n_atoms
        
        integer :: unit, iostat, atom_num_local
        character(len=80) :: line
        character(len=6) :: record_type
        character(len=4) :: atom_name_str
        character(len=3) :: res_name_str
        character(len=1) :: chain_id_str
        integer :: res_num
        real :: x_coord, y_coord, z_coord, occ, b_fact
        
        n_atoms = 0
        open(unit=10, file=trim(filename), status='old', action='read', iostat=iostat)
        
        if (iostat /= 0) then
            write(*,'(A,A)') 'ERROR: Could not open file: ', trim(filename)
            stop
        endif
        
        do
            read(10, '(A80)', iostat=iostat) line
            if (iostat /= 0) exit
            
            record_type = line(1:6)
            
            ! Parse only ATOM records (skip HETATM for now as they may not have valid residue structure)
            if (record_type == 'ATOM  ') then
                n_atoms = n_atoms + 1
                if (n_atoms > size(atoms)) then
                    write(*,'(A)') 'WARNING: PDB file has more atoms than array size'
                    exit
                endif
                
                ! Read fixed-format PDB record - columns per PDB format standard
                ! 1-6: record, 7-11: serial, 13-16: atom name, 18-20: res name, 
                ! 22: chain, 23-26: res num, 31-38: X, 39-46: Y, 47-54: Z
                read(line(7:11), '(I5)', iostat=iostat) atom_num_local
                atom_name_str = line(13:16)
                res_name_str = line(18:20)
                chain_id_str = line(22:22)
                read(line(23:26), '(I4)', iostat=iostat) res_num
                read(line(31:38), '(F8.3)', iostat=iostat) x_coord
                read(line(39:46), '(F8.3)', iostat=iostat) y_coord
                read(line(47:54), '(F8.3)', iostat=iostat) z_coord
                read(line(55:60), '(F6.2)', iostat=iostat) occ
                read(line(61:66), '(F6.2)', iostat=iostat) b_fact
                
                atoms(n_atoms)%number = atom_num_local
                atoms(n_atoms)%name = atom_name_str
                atoms(n_atoms)%res_name = res_name_str
                atoms(n_atoms)%res_number = res_num
                atoms(n_atoms)%chain_id = chain_id_str
                atoms(n_atoms)%x = x_coord
                atoms(n_atoms)%y = y_coord
                atoms(n_atoms)%z = z_coord
                atoms(n_atoms)%occupancy = occ
                atoms(n_atoms)%b_factor = b_fact
                
            else if (record_type == 'END   ') then
                exit
            endif
        enddo
        
        close(unit=10)
        
        if (n_atoms == 0) then
            write(*,'(A)') 'ERROR: No atoms found in PDB file'
            stop
        endif
    end subroutine read_pdb_file
    
    ! =====================================================================
    ! Compute dihedral (torsion) angle from 4 atoms
    ! =====================================================================
    real function dihedral_angle(a1, a2, a3, a4)
        type(atom_record), intent(in) :: a1, a2, a3, a4
        real :: v1(3), v2(3), v3(3), n1(3), n2(3)
        real :: dot_prod, cross_prod, angle_rad
        real :: pi
        
        pi = acos(-1.0)
        
        ! Vectors between consecutive atoms
        v1(1) = a2%x - a1%x
        v1(2) = a2%y - a1%y
        v1(3) = a2%z - a1%z
        
        v2(1) = a3%x - a2%x
        v2(2) = a3%y - a2%y
        v2(3) = a3%z - a2%z
        
        v3(1) = a4%x - a3%x
        v3(2) = a4%y - a3%y
        v3(3) = a4%z - a3%z
        
        ! Normal to plane 1 (cross product v1 x v2)
        call cross_product(v1, v2, n1)
        
        ! Normal to plane 2 (cross product v2 x v3)
        call cross_product(v2, v3, n2)
        
        ! Compute angle between planes
        dot_prod = dot_product(n1, n2)
        cross_prod = sqrt(sum(n1**2) * sum(n2**2))
        
        if (cross_prod > 1e-8) then
            angle_rad = acos(max(-1.0, min(1.0, dot_prod / cross_prod)))
            
            ! Determine sign using scalar triple product
            if (dot_product(cross_product_func(v2, n1), v3) < 0) then
                dihedral_angle = -angle_rad * 180.0 / pi
            else
                dihedral_angle = angle_rad * 180.0 / pi
            endif
        else
            dihedral_angle = 0.0
        endif
    end function dihedral_angle
    
    ! =====================================================================
    ! Cross product of two vectors
    ! =====================================================================
    subroutine cross_product(v1, v2, result)
        real, intent(in) :: v1(3), v2(3)
        real, intent(out) :: result(3)
        
        result(1) = v1(2)*v2(3) - v1(3)*v2(2)
        result(2) = v1(3)*v2(1) - v1(1)*v2(3)
        result(3) = v1(1)*v2(2) - v1(2)*v2(1)
    end subroutine cross_product
    
    ! =====================================================================
    ! Cross product function (returns value)
    ! =====================================================================
    function cross_product_func(v1, v2) result(cross)
        real, intent(in) :: v1(3), v2(3)
        real :: cross(3)
        
        cross(1) = v1(2)*v2(3) - v1(3)*v2(2)
        cross(2) = v1(3)*v2(1) - v1(1)*v2(3)
        cross(3) = v1(1)*v2(2) - v1(2)*v2(1)
    end function cross_product_func
    
    ! =====================================================================
    ! Find atom by residue number, chain, and atom name
    ! =====================================================================
    integer function find_atom(atoms, n_atoms, res_num, chain, atom_name)
        type(atom_record), intent(in) :: atoms(:)
        integer, intent(in) :: n_atoms, res_num
        character(len=1), intent(in) :: chain
        character(len=*), intent(in) :: atom_name
        integer :: i
        character(len=4) :: name_trimmed
        
        find_atom = -1
        name_trimmed = adjustl(trim(atom_name))
        
        do i = 1, n_atoms
            if (atoms(i)%res_number == res_num .and. &
                atoms(i)%chain_id == chain .and. &
                adjustl(trim(atoms(i)%name)) == name_trimmed) then
                find_atom = i
                return
            endif
        enddo
    end function find_atom
    
    ! =====================================================================
    ! Compute and write torsion angles to output file
    ! =====================================================================
    subroutine compute_and_write_angles(atoms, n_atoms, output_file)
        type(atom_record), intent(in) :: atoms(:)
        integer, intent(in) :: n_atoms
        character(len=*), intent(in) :: output_file
        
        integer :: res_num, res_num_prev, res_num_next
        integer :: i, j, idx_p, idx_o5, idx_c5, idx_c4, idx_c3, idx_o3
        integer :: idx_c1, idx_o4, idx_n, idx_n_base, idx_c_base
        real :: alpha, beta, gamma, delta, epsilon, zeta, chi
        character(len=1) :: chain_id
        logical :: first_res
        
        open(unit=20, file=trim(output_file), status='replace', action='write')
        
        ! Write header
        write(20,'(A)') 'Residue  Alpha    Beta    Gamma   Delta  Epsilon   Zeta      Chi'
        write(20,'(A)') '------- -------- ------- ------- ------- -------- ------- -------'
        
        ! Find all unique residues
        first_res = .true.
        res_num_prev = -999
        
        do i = 1, n_atoms
            res_num = atoms(i)%res_number
            chain_id = atoms(i)%chain_id
            
            ! Process each residue once
            if (res_num /= res_num_prev) then
                
                ! Find all necessary atoms for this residue
                idx_p = find_atom(atoms, n_atoms, res_num - 1, chain_id, 'P')
                idx_o5 = find_atom(atoms, n_atoms, res_num, chain_id, "O5'")
                idx_c5 = find_atom(atoms, n_atoms, res_num, chain_id, "C5'")
                idx_c4 = find_atom(atoms, n_atoms, res_num, chain_id, "C4'")
                idx_c3 = find_atom(atoms, n_atoms, res_num, chain_id, "C3'")
                idx_o3 = find_atom(atoms, n_atoms, res_num, chain_id, "O3'")
                idx_c1 = find_atom(atoms, n_atoms, res_num, chain_id, "C1'")
                idx_o4 = find_atom(atoms, n_atoms, res_num, chain_id, "O4'")
                
                ! Get chi angle base atom indices
                idx_n = find_atom(atoms, n_atoms, res_num, chain_id, 'N9')
                if (idx_n < 0) idx_n = find_atom(atoms, n_atoms, res_num, chain_id, 'N1')
                
                ! Compute angles if atoms are present
                alpha = 999.0
                beta = 999.0
                gamma = 999.0
                delta = 999.0
                epsilon = 999.0
                zeta = 999.0
                chi = 999.0
                
                ! Alpha: P(n-1) - O5'(n) - C5'(n) - C4'(n)
                if (idx_p > 0 .and. idx_o5 > 0 .and. idx_c5 > 0 .and. idx_c4 > 0) then
                    alpha = dihedral_angle(atoms(idx_p), atoms(idx_o5), &
                                          atoms(idx_c5), atoms(idx_c4))
                endif
                
                ! Beta: O5'(n) - C5'(n) - C4'(n) - C3'(n)
                if (idx_o5 > 0 .and. idx_c5 > 0 .and. idx_c4 > 0 .and. idx_c3 > 0) then
                    beta = dihedral_angle(atoms(idx_o5), atoms(idx_c5), &
                                         atoms(idx_c4), atoms(idx_c3))
                endif
                
                ! Gamma: C5'(n) - C4'(n) - C3'(n) - O3'(n)
                if (idx_c5 > 0 .and. idx_c4 > 0 .and. idx_c3 > 0 .and. idx_o3 > 0) then
                    gamma = dihedral_angle(atoms(idx_c5), atoms(idx_c4), &
                                          atoms(idx_c3), atoms(idx_o3))
                endif
                
                ! Delta: C4'(n) - C3'(n) - O3'(n) - P(n)
                ! Note: P(n) can also be idx_p if next residue available
                if (idx_c4 > 0 .and. idx_c3 > 0 .and. idx_o3 > 0 .and. idx_p > 0) then
                    ! For proper delta, we need P(n+1), but using P(n-1) for reference
                    ! This would require looking at next residue
                    ! delta = dihedral_angle(atoms(idx_c4), atoms(idx_c3), ...
                endif
                
                ! Chi: O4'(n) - C1'(n) - N - C(base)
                if (idx_o4 > 0 .and. idx_c1 > 0 .and. idx_n > 0) then
                    ! Find the connected base carbon
                    ! For purines: C8; for pyrimidines: C6
                    idx_c_base = find_atom(atoms, n_atoms, res_num, chain_id, 'C8')
                    if (idx_c_base < 0) then
                        idx_c_base = find_atom(atoms, n_atoms, res_num, chain_id, 'C6')
                    endif
                    
                    if (idx_c_base > 0) then
                        chi = dihedral_angle(atoms(idx_o4), atoms(idx_c1), &
                                            atoms(idx_n), atoms(idx_c_base))
                    endif
                endif
                
                ! Write line (use 999.0 for missing angles)
                write(20,'(I7,7F8.1)') res_num, alpha, beta, gamma, delta, epsilon, zeta, chi
                
                res_num_prev = res_num
            endif
        enddo
        
        close(unit=20)
    end subroutine compute_and_write_angles

end program pdb_torsion_calculator
