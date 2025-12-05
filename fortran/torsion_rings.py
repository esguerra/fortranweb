#!/usr/bin/env python3
"""
Torsion Rings Visualization Generator
Generates PNG and PDF plots of backbone torsion angles in concentric rings format
"""

import sys
import argparse
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np


def read_torsion_data(input_file):
    """Read torsion angle data from tab-separated or space-separated file"""
    angles = []
    
    try:
        with open(input_file, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or 'Residue' in line or '---' in line:
                    continue
                
                try:
                    values = line.split()
                    # Skip empty values
                    values = [v for v in values if v]
                    
                    # Format can be:
                    # 1) res_num, alpha, beta, gamma, delta, epsilon, zeta, chi (8 values)
                    # 2) res_num, nuctype, alpha, beta, gamma, delta, epsilon, zeta, chi (9 values)
                    if len(values) >= 8:
                        # Try to parse as floats - skip first column (residue number)
                        # If second column is also non-numeric (nucleotide type), skip it too
                        try:
                            float(values[1])
                            # Second value is numeric - format 1 (just numbers)
                            angle_values = list(map(float, values[1:8]))
                        except ValueError:
                            # Second value is non-numeric (nucleotide type) - format 2
                            angle_values = list(map(float, values[2:9]))
                        
                        angles.append(angle_values)
                except (ValueError, IndexError):
                    continue
    
    except IOError as e:
        print(f"Error reading file: {e}")
        sys.exit(1)
    
    return angles


def generate_rings_plot(angles, output_file, title="Backbone Torsion Rings", format_type='png'):
    """Generate concentric rings visualization"""
    
    if not angles:
        print("Error: No torsion angle data found")
        sys.exit(1)
    
    n_residues = len(angles)
    n_angles = 7
    
    # Define colors for each angle type (reversed order: Chi innermost, Alpha outermost)
    colors = [
        (0.8, 0.0, 0.8),      # Chi: Purple (innermost)
        (0.0, 0.8, 0.8),      # Zeta: Cyan
        (1.0, 0.0, 1.0),      # Epsilon: Magenta
        (1.0, 0.5, 0.0),      # Delta: Orange
        (0.0, 0.0, 1.0),      # Gamma: Blue
        (0.0, 0.8, 0.0),      # Beta: Green
        (1.0, 0.0, 0.0)       # Alpha: Red (outermost)
    ]
    
    labels = ["χ", "ζ", "ε", "δ", "γ", "β", "α"]
    
    # Create figure
    fig, ax = plt.subplots(figsize=(12, 11))
    fig.suptitle(title, fontsize=16, fontweight="bold")
    
    # Set axis properties
    ax.set_xlim(-600, 600)
    ax.set_ylim(-600, 600)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.set_facecolor("white")
    
    # Draw reference circles
    for radius in [80, 150, 220, 290, 360, 430, 500, 570]:
        circle = patches.Circle((0, 0), radius, fill=False, edgecolor="#e0e0e0", linewidth=0.5)
        ax.add_patch(circle)
    
    # Draw degree markers at 0, 60, 120, 180, 240 degrees (clockwise)
    marker_degrees = [0, 60, 120, 180, 240, 300]
    marker_radius = 600  # Distance for degree labels
    
    for degree in marker_degrees:
        # Negate angle to make it clockwise (matplotlib uses counter-clockwise by default)
        angle_rad = np.radians(-degree)
        x = marker_radius * np.cos(angle_rad)
        y = marker_radius * np.sin(angle_rad)
        
        # Draw marker line
        x_inner = 550 * np.cos(angle_rad)
        y_inner = 550 * np.sin(angle_rad)
        x_outer = 580 * np.cos(angle_rad)
        y_outer = 580 * np.sin(angle_rad)
        
        ax.plot([x_inner, x_outer], [y_inner, y_outer], color="#333333", linewidth=1.5)
        
        # Draw degree label
        ax.text(x, y, f"{degree}°", ha='center', va='center', fontsize=10, fontweight='bold')
    
    # Draw spokes for each ring and residue
    for ring_num in range(n_angles):
        r_inner = 80 + ring_num * 70
        r_outer = r_inner + 70
        
        # Reverse the angle index (6=chi, 5=zeta, ..., 0=alpha)
        angle_index = n_angles - 1 - ring_num
        
        for res_num, angle_values in enumerate(angles):
            angle_value = angle_values[angle_index]
            
            # Skip missing values
            if angle_value == 999.0:
                continue
            
            # Convert angle to position (0-360)
            angle_position_deg = (angle_value + 360.0) % 360.0
            angle_rad = np.radians(angle_position_deg)
            
            # Calculate spoke endpoints
            x1 = r_inner * np.cos(angle_rad)
            y1 = r_inner * np.sin(angle_rad)
            x2 = r_outer * np.cos(angle_rad)
            y2 = r_outer * np.sin(angle_rad)
            
            # Color intensity based on absolute angle value
            color_intensity = 0.4 + abs(angle_value) / 180.0 * 0.6
            color = tuple(c * color_intensity for c in colors[ring_num])
            
            # Draw spoke
            ax.plot([x1, x2], [y1, y2], color=color, linewidth=1.5, alpha=0.8)
    
    # Add legend
    legend_handles = []
    for i, label in enumerate(labels):
        color = colors[i]
        from matplotlib.patches import Patch
        legend_handles.append(Patch(facecolor=color, label=f"Ring {i+1}: {label}"))
    
    ax.legend(handles=legend_handles, loc='upper left', bbox_to_anchor=(1.0, 1.0))
    
    # Save figure
    try:
        if format_type == 'pdf':
            plt.savefig(output_file, format='pdf', dpi=150, bbox_inches="tight", facecolor="white")
        else:  # PNG is default
            plt.savefig(output_file, format='png', dpi=150, bbox_inches="tight", facecolor="white")
        
        plt.close()
        print(f"Successfully generated: {output_file}")
        
    except IOError as e:
        print(f"Error saving figure: {e}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Generate torsion rings visualization from angle data"
    )
    parser.add_argument('input_file', help='Tab-separated torsion angles file')
    parser.add_argument('-o', '--output', default='rings.png', help='Output file (default: rings.png)')
    parser.add_argument('-t', '--title', default='Backbone Torsion Rings', help='Plot title')
    parser.add_argument('-f', '--format', choices=['png', 'pdf'], default='png', help='Output format (default: png)')
    
    args = parser.parse_args()
    
    # Read data
    print(f"Reading torsion angles from: {args.input_file}")
    angles = read_torsion_data(args.input_file)
    print(f"Read {len(angles)} residues with {len(angles[0]) if angles else 0} angle types")
    
    # Generate plot
    generate_rings_plot(angles, args.output, args.title, args.format)


if __name__ == '__main__':
    main()
