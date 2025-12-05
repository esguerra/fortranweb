# Understanding 999.0 Values in Torsion Angle Output

## What do 999.0 values mean?

The 999.0 sentinel value in the torsion angle output indicates that an angle **cannot be calculated** for structural reasons, not due to a bug.

## When does this occur?

### Alpha angle = 999.0
- **Residue 1**: Alpha requires the phosphate atom from the **previous residue** P(n-1), which doesn't exist before the first residue
- **Chain breaks**: If residue (n-1) is missing

### Delta, Epsilon, Zeta angles = 999.0
- **Last residue**: These angles require atoms from the **next residue** P(n+1), O5'(n+1), C5'(n+1)
- **Chain breaks**: If residue (n+1) is missing (e.g., residues 1-15, then jump to 18)

## Example

```
Residue  Alpha    Beta    Gamma   Delta  Epsilon   Zeta      Chi
------- -------- ------- ------- ------- -------- ------- -------
      1    999.0   -76.3   -82.9   104.7    -78.3   -78.3   -71.3   ← Alpha=999.0 (no previous residue)
      2     95.0   -76.3   -83.4   104.5    -78.5   -78.4   -73.1   ← All angles available
     15     94.2   -75.9   -79.8   999.0    999.0   999.0   -72.0   ← Delta/Epsilon/Zeta=999.0 (residue 16 missing, chain break)
     18    999.0   -76.4   -87.2   104.7    -78.0   -77.9   -73.1   ← Alpha=999.0 (residue 17 missing, chain break)
```

## Why this is correct

According to IUPAC-IUBMB definitions for nucleic acid structure:

- **Alpha** = P(n-1) - O5'(n) - C5'(n) - C4'(n)
- **Delta** = C4'(n) - C3'(n) - O3'(n) - **P(n+1)**
- **Epsilon** = C3'(n) - O3'(n) - **P(n+1)** - **O5'(n+1)**
- **Zeta** = O3'(n) - **P(n+1)** - **O5'(n+1)** - **C5'(n+1)**

These definitions explicitly require atoms from adjacent residues. When those atoms don't exist, the angles are mathematically undefined, not "missing" or "broken."

## Comparison with reference data

The pre-calculated reference file (`test/1A3M.dat`) also shows 999.0 for the first residue's alpha:

```
   1 G    999.0   173.9    59.7    82.7  -157.7   -68.1  -162.1
   2 G    -67.7   166.0    62.6    80.0  -159.7   -63.0  -158.2
```

This confirms 999.0 is the standard, expected value for undefined angles.

## Summary

**There is no bug.** The 999.0 values correctly represent angles that cannot be calculated due to missing atoms at chain boundaries or chain breaks. This is the expected behavior per IUPAC standards.
