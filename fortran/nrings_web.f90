! Web-friendly version of Torsion Rings Generator
! Modified to work with programmatic input/output
! 
! A. R. Srinivasan and Wilma K. Olson (1995)
! Modified for web integration (2025)

program torsion_rings
    implicit none
    integer :: ntor(10), nc, n, i, j, ij, jj, ntr
    real :: did(5000,8), ix(5000), iy(5000), x(5000), y(5000)
    real :: check, phi, rint, con, shift, see, del, s1, s2
    real :: ars, siva, ang, rot, x1, x2, y1, y2, x3, y3
    real :: c11, c12, c13
    character(len=3) :: al(10), col
    character(len=80) :: INPUT, title
    integer :: iostat
    
    ! Read input file path
    write(*,*) 'Enter input file path:'
    read(*,'(A80)') INPUT
    
    ! Read number of torsion types
    write(*,*) 'Enter number of torsion types (1-7):'
    read(*,*) nc
    
    if (nc < 1 .or. nc > 7) then
        write(*,*) 'Error: nc must be between 1 and 7'
        stop
    endif
    
    ! Open files
    open(unit=9, file=trim(INPUT), status='old', action='read', iostat=iostat)
    if (iostat /= 0) then
        write(*,*) 'Error opening input file: ', trim(INPUT)
        stop
    endif
    
    open(unit=12, file='rings.ps', status='replace', action='write')
    
    write(12, '(A)') '%!'
    write(12, '(A)') 'newpath'
    
    ! Read input data
    n = 0
    do while (n < 5000)
        n = n + 1
        read(9, '(7F8.1)', iostat=iostat) (did(n,j), j=1,7)
        if (iostat /= 0) exit
    enddo
    n = n - 1
    
    write(*,*) 'Read ', n, ' data records'
    
    ! Read torsion indices
    do i = 1, nc
        write(*,*) 'Enter torsion index', i, ':'
        read(*,*) ntor(i)
    enddo
    
    ! Calculate parameters
    check = real(nc + 1) / 10.0 - 0.01
    phi = acos(-1.0)
    rint = real(nc + 1) / real((nc + 1) * 10)
    con = phi / 180.0
    shift = con * 90.0
    see = rint
    
    ! Draw concentric circles
    do while (see < check + 0.01)
        del = 0.0
        do i = 1, 361
            x(i) = see * cos(del)
            y(i) = see * sin(del)
            ix(i) = nint(250.0 * x(i) + 300.0)
            iy(i) = nint(250.0 * y(i) + 350.0)
            if (i == 1) then
                write(12, '(I5,A,I5,A)') nint(ix(1)), ' ', nint(iy(1)), ' moveto'
            else
                write(12, '(I5,A,I5,A)') nint(ix(i)), ' ', nint(iy(i)), ' lineto'
            endif
            del = del + con
        enddo
        see = see + rint
    enddo
    
    see = see - rint  ! Back up to last valid value
    ars = rint
    siva = rint + rint
    
    write(12, '(A)') 'stroke'
    write(12, '(A)') '1.0 setlinewidth'
    write(12, '(A)') '/dol {setrgbcolor 4 -2 roll moveto lineto stroke}def'
    write(12, '(A)') 'gsave'
    
    ! Plot torsion data
    do jj = 1, nc
        call set_color(jj, col)
        ntr = ntor(jj)
        
        do i = 1, n
            if (abs(did(i, ntr) - 999.0) < 0.01) cycle
            if (did(i, ntr) < 0.0) did(i, ntr) = did(i, ntr) + 360.0
            
            rot = con * did(i, ntr)
            rot = -rot + shift
            
            x1 = 250.0 * ars * cos(rot) + 300.0
            x2 = 250.0 * siva * cos(rot) + 300.0
            y1 = 250.0 * ars * sin(rot) + 350.0
            y2 = 250.0 * siva * sin(rot) + 350.0
            
            call colnum(col, c11, c12, c13)
            write(12, '(F10.2,A,F10.2,A,F10.2,A,F10.2,A,3F5.1,A)') &
                x1, ' ', y1, ' ', x2, ' ', y2, ' ', c11, c12, c13, ' dol'
        enddo
        
        ars = siva
        siva = siva + rint
    enddo
    
    ! Add angle markers
    write(12, '(A)') 'newpath'
    siva = ars + 0.02
    ang = 0.0
    write(12, '(A)') '/Times-Bold findfont 20 scalefont setfont'
    
    do i = 1, 12
        ang = ang + 30.0
        rot = con * ang
        x1 = 250.0 * ars * cos(rot) + 300.0
        x2 = 250.0 * siva * cos(rot) + 300.0
        y1 = 250.0 * ars * sin(rot) + 350.0
        y2 = 250.0 * siva * sin(rot) + 350.0
        
        write(12, '(F10.2,A,F10.2,A,F10.2,A,F10.2,A,3F5.1,A)') &
            x1, ' ', y1, ' ', x2, ' ', y2, ' 0 0 0 dol'
        
        select case(i)
        case(3)
            x3 = x2 - 6.0
            y3 = y2 + 2.0
            write(12, '(2F8.2,A)') x3, y3, ' moveto (0) 0 setgray show'
        case(6)
            x3 = x2 - 23.0
            y3 = y2
            write(12, '(2F8.2,A)') x3, y3, ' moveto (-90) 0 setgray show'
        case(9)
            x3 = x2 - 10.0
            y3 = y2 - 15.0
            write(12, '(2F8.2,A)') x3, y3, ' moveto (180) 0 setgray show'
        case(12)
            x3 = x2
            y3 = y2 + 2.0
            write(12, '(2F8.2,A)') x3, y3, ' moveto ( 90) 0 setgray show'
        end select
    enddo
    
    ! Add labels
    write(12, '(A)') 'stroke'
    write(12, '(A)') '/Symbol findfont 20.0 scalefont setfont'
    
    do i = 1, nc
        write(*,*) 'Enter label for ring', i, ':'
        read(*,'(A3)') al(i)
    enddo
    
    do i = 1, nc
        select case(i)
        case(1)
            y3 = 380.0
        case(2)
            y3 = 403.0
        case(3)
            y3 = 430.0
        case(4)
            y3 = 455.0
        case(5)
            y3 = 481.0
        case(6)
            y3 = 505.0
        case(7)
            y3 = 530.0
        case default
            y3 = 380.0 + real(i - 1) * 25.0
        end select
        
        write(12, '(A,F5.1,A,A3,A)') &
            'newpath 300 ', y3, ' moveto (', trim(al(i)), ') 0 setgray show'
    enddo
    
    ! Add title
    write(12, '(A)') 'stroke'
    write(12, '(A)') '/Times-Bold findfont 20.0 scalefont setfont'
    write(12, '(A)') 'newpath'
    write(*,*) 'Enter title:'
    read(*,'(A80)') title
    write(12, '(A,A,A)') ' 220.0 100.0 moveto (', trim(title), ') show'
    
    write(12, '(A)') 'stroke'
    write(12, '(A)') 'showpage'
    
    close(unit=9)
    close(unit=12)
    
    write(*,*) 'Output saved to rings.ps'
    
contains

    subroutine set_color(ring_num, col)
        integer, intent(in) :: ring_num
        character(len=3), intent(out) :: col
        
        select case(ring_num)
        case(1)
            col = 'blu'
        case(2)
            col = 'gre'
        case(3)
            col = 'red'
        case(4)
            col = 'yel'
        case(5)
            col = 'cya'
        case(6)
            col = 'pur'
        case(7)
            col = 'gra'
        case default
            col = 'bla'
        end select
    end subroutine set_color
    
    subroutine colnum(col, c1, c2, c3)
        character(len=3), intent(in) :: col
        real, intent(out) :: c1, c2, c3
        
        select case(col)
        case('blu')
            c1 = 0.0
            c2 = 0.0
            c3 = 1.0
        case('gre')
            c1 = 0.0
            c2 = 1.0
            c3 = 0.0
        case('red')
            c1 = 1.0
            c2 = 0.0
            c3 = 0.0
        case('yel')
            c1 = 1.0
            c2 = 1.0
            c3 = 0.0
        case('cya')
            c1 = 0.0
            c2 = 1.0
            c3 = 1.0
        case('pur')
            c1 = 0.5
            c2 = 0.0
            c3 = 0.5
        case('gra')
            c1 = 0.5
            c2 = 0.5
            c3 = 0.5
        case default
            c1 = 0.0
            c2 = 0.0
            c3 = 0.0
        end select
    end subroutine colnum

end program torsion_rings
