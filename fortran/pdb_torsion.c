/*
 * =====================================================================
 * PDB to Torsion Angles Calculator (C version)
 * =====================================================================
 * Reads a PDB file and computes backbone dihedral angles for nucleic acids
 *
 * Backbone torsion angles (standard nomenclature):
 *   alpha:   P(n-1) - O5'(n) - C5'(n) - C4'(n)
 *   beta:    O5'(n) - C5'(n) - C4'(n) - C3'(n)
 *   gamma:   C5'(n) - C4'(n) - C3'(n) - O3'(n)
 *   delta:   C4'(n) - C3'(n) - O3'(n) - P(n+1)
 *   epsilon: C3'(n) - O3'(n) - P(n+1) - O5'(n+1)
 *   zeta:    O3'(n) - P(n+1) - O5'(n+1) - C5'(n+1)
 *   chi:     O4'(n) - C1'(n) - N(9/1)(n) - C(8/2)(n)
 *
 * Reference: IUPAC-IUBMB definitions for nucleic acid structure
 * =====================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

#define MAX_ATOMS 5000
#define MAX_RESIDUES 500
#define PI 3.14159265358979323846

typedef struct {
    int number;
    char name[5];
    char res_name[4];
    int res_number;
    char chain_id;
    float x, y, z;
    float occupancy, b_factor;
} atom_record;

/* Function prototypes */
void read_pdb_file(const char *filename, atom_record *atoms, int *n_atoms);
float dihedral_angle(atom_record a1, atom_record a2, atom_record a3, atom_record a4);
void cross_product(float v1[3], float v2[3], float result[3]);
int find_atom(atom_record *atoms, int n_atoms, int res_num, char chain, const char *atom_name);
void compute_and_write_angles(atom_record *atoms, int n_atoms, const char *output_file);
float dot_product(float v1[3], float v2[3]);
float magnitude(float v[3]);
void normalize(float v[3]);

/* =====================================================================
 * Main program
 * ===================================================================== */
int main(int argc, char *argv[]) {
    atom_record *atoms;
    int n_atoms;
    char pdb_file[256];
    char output_file[256] = "torsion_angles.dat";
    
    if (argc < 2) {
        fprintf(stderr, "Usage: pdb_torsion <pdb_file> [output_file]\n");
        fprintf(stderr, "If output_file is not specified, torsion_angles.dat is used\n");
        return 1;
    }
    
    strcpy(pdb_file, argv[1]);
    if (argc >= 3) {
        strcpy(output_file, argv[2]);
    }
    
    /* Allocate memory for atoms */
    atoms = (atom_record *)malloc(MAX_ATOMS * sizeof(atom_record));
    if (atoms == NULL) {
        fprintf(stderr, "ERROR: Memory allocation failed\n");
        return 1;
    }
    
    /* Read PDB file */
    read_pdb_file(pdb_file, atoms, &n_atoms);
    printf("Successfully read %d atoms from PDB file\n", n_atoms);
    
    /* Compute and write torsion angles */
    compute_and_write_angles(atoms, n_atoms, output_file);
    printf("Torsion angles written to: %s\n", output_file);
    
    /* Free memory */
    free(atoms);
    
    return 0;
}

/* =====================================================================
 * Read a PDB file and extract atom coordinates
 * ===================================================================== */
void read_pdb_file(const char *filename, atom_record *atoms, int *n_atoms) {
    FILE *fp;
    char line[81];
    char record_type[7];
    char atom_name_str[5];
    char res_name_str[4];
    char chain_id_str;
    int atom_num_local, res_num;
    float x_coord, y_coord, z_coord, occ, b_fact;
    
    *n_atoms = 0;
    fp = fopen(filename, "r");
    
    if (fp == NULL) {
        fprintf(stderr, "ERROR: Could not open file: %s\n", filename);
        exit(1);
    }
    
    while (fgets(line, sizeof(line), fp) != NULL) {
        /* Get record type (first 6 characters) */
        strncpy(record_type, line, 6);
        record_type[6] = '\0';
        
        /* Parse only ATOM records */
        if (strncmp(record_type, "ATOM  ", 6) == 0) {
            if (*n_atoms >= MAX_ATOMS) {
                fprintf(stderr, "WARNING: PDB file has more atoms than array size\n");
                break;
            }
            
            /* Read fixed-format PDB record */
            sscanf(line + 6, "%5d", &atom_num_local);
            strncpy(atom_name_str, line + 12, 4);
            atom_name_str[4] = '\0';
            strncpy(res_name_str, line + 17, 3);
            res_name_str[3] = '\0';
            chain_id_str = line[21];
            sscanf(line + 22, "%4d", &res_num);
            sscanf(line + 30, "%8f", &x_coord);
            sscanf(line + 38, "%8f", &y_coord);
            sscanf(line + 46, "%8f", &z_coord);
            sscanf(line + 54, "%6f", &occ);
            sscanf(line + 60, "%6f", &b_fact);
            
            atoms[*n_atoms].number = atom_num_local;
            strcpy(atoms[*n_atoms].name, atom_name_str);
            strcpy(atoms[*n_atoms].res_name, res_name_str);
            atoms[*n_atoms].res_number = res_num;
            atoms[*n_atoms].chain_id = chain_id_str;
            atoms[*n_atoms].x = x_coord;
            atoms[*n_atoms].y = y_coord;
            atoms[*n_atoms].z = z_coord;
            atoms[*n_atoms].occupancy = occ;
            atoms[*n_atoms].b_factor = b_fact;
            
            (*n_atoms)++;
        } else if (strncmp(record_type, "END   ", 6) == 0) {
            break;
        }
    }
    
    fclose(fp);
    
    if (*n_atoms == 0) {
        fprintf(stderr, "ERROR: No atoms found in PDB file\n");
        exit(1);
    }
}

/* =====================================================================
 * Dot product of two vectors
 * ===================================================================== */
float dot_product(float v1[3], float v2[3]) {
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
}

/* =====================================================================
 * Magnitude (length) of a vector
 * ===================================================================== */
float magnitude(float v[3]) {
    return sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

/* =====================================================================
 * Normalize a vector (make it unit length)
 * ===================================================================== */
void normalize(float v[3]) {
    float mag = magnitude(v);
    if (mag > 1e-8) {
        v[0] /= mag;
        v[1] /= mag;
        v[2] /= mag;
    }
}

/* =====================================================================
 * Cross product of two vectors
 * ===================================================================== */
void cross_product(float v1[3], float v2[3], float result[3]) {
    result[0] = v1[1] * v2[2] - v1[2] * v2[1];
    result[1] = v1[2] * v2[0] - v1[0] * v2[2];
    result[2] = v1[0] * v2[1] - v1[1] * v2[0];
}

/* =====================================================================
 * Compute dihedral (torsion) angle from 4 atoms
 * ===================================================================== */
float dihedral_angle(atom_record a1, atom_record a2, atom_record a3, atom_record a4) {
    float v1[3], v2[3], v3[3];
    float n1[3], n2[3];
    float dot_prod, cross_prod, angle_rad;
    float dihedral;
    float triple[3];
    
    /* Vectors between consecutive atoms */
    v1[0] = a2.x - a1.x;
    v1[1] = a2.y - a1.y;
    v1[2] = a2.z - a1.z;
    
    v2[0] = a3.x - a2.x;
    v2[1] = a3.y - a2.y;
    v2[2] = a3.z - a2.z;
    
    v3[0] = a4.x - a3.x;
    v3[1] = a4.y - a3.y;
    v3[2] = a4.z - a3.z;
    
    /* Normal to plane 1 (cross product v1 x v2) */
    cross_product(v1, v2, n1);
    
    /* Normal to plane 2 (cross product v2 x v3) */
    cross_product(v2, v3, n2);
    
    /* Compute angle between planes */
    dot_prod = dot_product(n1, n2);
    cross_prod = magnitude(n1) * magnitude(n2);
    
    if (cross_prod > 1e-8) {
        /* Clamp dot product to avoid numerical issues with acos */
        if (dot_prod > 1.0) dot_prod = 1.0;
        if (dot_prod < -1.0) dot_prod = -1.0;
        
        angle_rad = acos(dot_prod / cross_prod);
        
        /* Determine sign using scalar triple product */
        cross_product(v2, n1, triple);
        if (dot_product(triple, v3) < 0) {
            dihedral = -angle_rad * 180.0 / PI;
        } else {
            dihedral = angle_rad * 180.0 / PI;
        }
    } else {
        dihedral = 0.0;
    }
    
    return dihedral;
}

/* =====================================================================
 * Find atom by residue number, chain, and atom name
 * ===================================================================== */
int find_atom(atom_record *atoms, int n_atoms, int res_num, char chain, const char *atom_name) {
    int i;
    char name_trimmed[5];
    
    /* Trim and convert atom name */
    strcpy(name_trimmed, atom_name);
    
    for (i = 0; i < n_atoms; i++) {
        if (atoms[i].res_number == res_num &&
            atoms[i].chain_id == chain &&
            strcmp(atoms[i].name, name_trimmed) == 0) {
            return i;
        }
    }
    
    return -1;
}

/* =====================================================================
 * Compute and write torsion angles to output file
 * ===================================================================== */
void compute_and_write_angles(atom_record *atoms, int n_atoms, const char *output_file) {
    FILE *fp;
    int res_num, res_num_prev;
    int i;
    int idx_p, idx_o5, idx_c5, idx_c4, idx_c3, idx_o3;
    int idx_c1, idx_o4, idx_n, idx_n_base, idx_c_base;
    int idx_p_next, idx_o5_next, idx_c5_next;
    float alpha, beta, gamma, delta, epsilon, zeta, chi;
    char chain_id;
    
    fp = fopen(output_file, "w");
    if (fp == NULL) {
        fprintf(stderr, "ERROR: Could not open output file: %s\n", output_file);
        return;
    }
    
    /* Write header */
    fprintf(fp, "Residue  Alpha    Beta    Gamma   Delta  Epsilon   Zeta      Chi\n");
    fprintf(fp, "------- -------- ------- ------- ------- -------- ------- -------\n");
    
    /* Find all unique residues */
    res_num_prev = -999;
    
    for (i = 0; i < n_atoms; i++) {
        res_num = atoms[i].res_number;
        chain_id = atoms[i].chain_id;
        
        /* Process each residue once */
        if (res_num != res_num_prev) {
            
            /* Find all necessary atoms for this residue */
            idx_p = find_atom(atoms, n_atoms, res_num - 1, chain_id, "P");
            idx_o5 = find_atom(atoms, n_atoms, res_num, chain_id, "O5'");
            idx_c5 = find_atom(atoms, n_atoms, res_num, chain_id, "C5'");
            idx_c4 = find_atom(atoms, n_atoms, res_num, chain_id, "C4'");
            idx_c3 = find_atom(atoms, n_atoms, res_num, chain_id, "C3'");
            idx_o3 = find_atom(atoms, n_atoms, res_num, chain_id, "O3'");
            idx_c1 = find_atom(atoms, n_atoms, res_num, chain_id, "C1'");
            idx_o4 = find_atom(atoms, n_atoms, res_num, chain_id, "O4'");
            
            /* For delta, epsilon, zeta: need atoms from NEXT residue */
            idx_p_next = find_atom(atoms, n_atoms, res_num + 1, chain_id, "P");
            idx_o5_next = find_atom(atoms, n_atoms, res_num + 1, chain_id, "O5'");
            idx_c5_next = find_atom(atoms, n_atoms, res_num + 1, chain_id, "C5'");
            
            /* Get chi angle base atom indices */
            idx_n = find_atom(atoms, n_atoms, res_num, chain_id, "N9");
            if (idx_n < 0) {
                idx_n = find_atom(atoms, n_atoms, res_num, chain_id, "N1");
            }
            
            /* Initialize angles */
            alpha = 999.0;
            beta = 999.0;
            gamma = 999.0;
            delta = 999.0;
            epsilon = 999.0;
            zeta = 999.0;
            chi = 999.0;
            
            /* Alpha: P(n-1) - O5'(n) - C5'(n) - C4'(n) */
            if (idx_p >= 0 && idx_o5 >= 0 && idx_c5 >= 0 && idx_c4 >= 0) {
                alpha = dihedral_angle(atoms[idx_p], atoms[idx_o5],
                                      atoms[idx_c5], atoms[idx_c4]);
            }
            
            /* Beta: O5'(n) - C5'(n) - C4'(n) - C3'(n) */
            if (idx_o5 >= 0 && idx_c5 >= 0 && idx_c4 >= 0 && idx_c3 >= 0) {
                beta = dihedral_angle(atoms[idx_o5], atoms[idx_c5],
                                     atoms[idx_c4], atoms[idx_c3]);
            }
            
            /* Gamma: C5'(n) - C4'(n) - C3'(n) - O3'(n) */
            if (idx_c5 >= 0 && idx_c4 >= 0 && idx_c3 >= 0 && idx_o3 >= 0) {
                gamma = dihedral_angle(atoms[idx_c5], atoms[idx_c4],
                                      atoms[idx_c3], atoms[idx_o3]);
            }
            
            /* Delta: C4'(n) - C3'(n) - O3'(n) - P(n+1) */
            if (idx_c4 >= 0 && idx_c3 >= 0 && idx_o3 >= 0 && idx_p_next >= 0) {
                delta = dihedral_angle(atoms[idx_c4], atoms[idx_c3],
                                      atoms[idx_o3], atoms[idx_p_next]);
            }
            
            /* Epsilon: C3'(n) - O3'(n) - P(n+1) - O5'(n+1) */
            if (idx_c3 >= 0 && idx_o3 >= 0 && idx_p_next >= 0 && idx_o5_next >= 0) {
                epsilon = dihedral_angle(atoms[idx_c3], atoms[idx_o3],
                                        atoms[idx_p_next], atoms[idx_o5_next]);
            }
            
            /* Zeta: O3'(n) - P(n+1) - O5'(n+1) - C5'(n+1) */
            if (idx_o3 >= 0 && idx_p_next >= 0 && idx_o5_next >= 0 && idx_c5_next >= 0) {
                zeta = dihedral_angle(atoms[idx_o3], atoms[idx_p_next],
                                     atoms[idx_o5_next], atoms[idx_c5_next]);
            }
            
            /* Chi: O4'(n) - C1'(n) - N - C(base) */
            if (idx_o4 >= 0 && idx_c1 >= 0 && idx_n >= 0) {
                /* Find the connected base carbon */
                /* For purines: C8; for pyrimidines: C6 */
                idx_c_base = find_atom(atoms, n_atoms, res_num, chain_id, "C8");
                if (idx_c_base < 0) {
                    idx_c_base = find_atom(atoms, n_atoms, res_num, chain_id, "C6");
                }
                
                if (idx_c_base >= 0) {
                    chi = dihedral_angle(atoms[idx_o4], atoms[idx_c1],
                                        atoms[idx_n], atoms[idx_c_base]);
                }
            }
            
            /* Write line (use 999.0 for missing angles) */
            fprintf(fp, "%7d %8.1f %7.1f %7.1f %7.1f %8.1f %7.1f %7.1f\n",
                   res_num, alpha, beta, gamma, delta, epsilon, zeta, chi);
            
            res_num_prev = res_num;
        }
    }
    
    fclose(fp);
}
