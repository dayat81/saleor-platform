#!/usr/bin/env python3
"""
OpenCV Chat GUI Visual Difference Analysis
==========================================

Advanced image processing tool using OpenCV to detect and analyze visual differences
between storefront and backoffice chat widgets with pixel-level precision.

Requirements:
- opencv-python
- numpy
- matplotlib
- scikit-image

Features:
- Pixel-level difference detection
- Structural similarity analysis
- Color difference mapping
- Feature detection and matching
- Automated region highlighting
- Statistical analysis reports
"""

import os
import sys
import cv2
import numpy as np
import matplotlib.pyplot as plt
import json
from datetime import datetime
from pathlib import Path
from typing import Tuple, List, Dict, Optional

try:
    from skimage.metrics import structural_similarity as ssim
    from skimage import feature, measure
except ImportError:
    print("Warning: scikit-image not available. Some advanced features will be disabled.")
    ssim = None

class OpenCVChatAnalyzer:
    """Advanced OpenCV-based chat GUI comparison tool."""
    
    def __init__(self, output_dir="opencv_analysis"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Analysis settings
        self.resize_width = 800  # Standardize image sizes for comparison
        self.resize_height = 600
        self.difference_threshold = 30  # Pixel difference threshold
        self.contour_min_area = 100  # Minimum area for significant differences
        
        # Color schemes for visualization
        self.colors = {
            'added': (0, 255, 0),      # Green for additions
            'removed': (0, 0, 255),    # Red for removals
            'changed': (0, 255, 255),  # Yellow for changes
            'identical': (128, 128, 128) # Gray for identical regions
        }
    
    def load_and_preprocess_image(self, image_path: str) -> Tuple[np.ndarray, np.ndarray]:
        """Load and preprocess image for analysis."""
        print(f"📸 Loading: {image_path}")
        
        # Load image
        if not Path(image_path).exists():
            raise FileNotFoundError(f"Image not found: {image_path}")
        
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not load image: {image_path}")
        
        # Convert to RGB for consistent processing
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Resize for consistent comparison
        img_resized = cv2.resize(img_rgb, (self.resize_width, self.resize_height))
        
        # Create grayscale version for certain analyses
        img_gray = cv2.cvtColor(img_resized, cv2.COLOR_RGB2GRAY)
        
        return img_resized, img_gray
    
    def calculate_pixel_difference(self, img1: np.ndarray, img2: np.ndarray) -> Tuple[np.ndarray, Dict]:
        """Calculate pixel-level differences between two images."""
        print("🔍 Calculating pixel differences...")
        
        # Calculate absolute difference
        diff = cv2.absdiff(img1, img2)
        
        # Convert to grayscale for threshold analysis
        diff_gray = cv2.cvtColor(diff, cv2.COLOR_RGB2GRAY)
        
        # Apply threshold to identify significant differences
        _, thresh = cv2.threshold(diff_gray, self.difference_threshold, 255, cv2.THRESH_BINARY)
        
        # Calculate statistics
        total_pixels = img1.shape[0] * img1.shape[1]
        different_pixels = np.count_nonzero(thresh)
        similarity_percentage = ((total_pixels - different_pixels) / total_pixels) * 100
        
        # Calculate average difference per channel
        avg_diff_r = np.mean(diff[:, :, 0])
        avg_diff_g = np.mean(diff[:, :, 1])
        avg_diff_b = np.mean(diff[:, :, 2])
        
        stats = {
            'total_pixels': int(total_pixels),
            'different_pixels': int(different_pixels),
            'similarity_percentage': float(similarity_percentage),
            'avg_difference': {
                'red': float(avg_diff_r),
                'green': float(avg_diff_g),
                'blue': float(avg_diff_b),
                'overall': float(np.mean(diff))
            }
        }
        
        return diff, thresh, stats
    
    def calculate_structural_similarity(self, img1_gray: np.ndarray, img2_gray: np.ndarray) -> Tuple[float, np.ndarray]:
        """Calculate structural similarity index (SSIM)."""
        if ssim is None:
            print("⚠️  SSIM analysis unavailable (scikit-image not installed)")
            return 0.0, np.zeros_like(img1_gray)
        
        print("📊 Calculating structural similarity...")
        
        # Calculate SSIM
        similarity_index, similarity_map = ssim(img1_gray, img2_gray, full=True)
        
        # Convert similarity map to 0-255 range
        similarity_map = (similarity_map * 255).astype(np.uint8)
        
        return similarity_index, similarity_map
    
    def detect_feature_differences(self, img1_gray: np.ndarray, img2_gray: np.ndarray) -> Dict:
        """Detect and compare features using various algorithms."""
        print("🎯 Detecting feature differences...")
        
        # Edge detection comparison
        edges1 = cv2.Canny(img1_gray, 50, 150)
        edges2 = cv2.Canny(img2_gray, 50, 150)
        edge_diff = cv2.absdiff(edges1, edges2)
        
        # Corner detection
        corners1 = cv2.goodFeaturesToTrack(img1_gray, maxCorners=100, qualityLevel=0.01, minDistance=10)
        corners2 = cv2.goodFeaturesToTrack(img2_gray, maxCorners=100, qualityLevel=0.01, minDistance=10)
        
        # Contour detection
        contours1, _ = cv2.findContours(edges1, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contours2, _ = cv2.findContours(edges2, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        feature_stats = {
            'corners': {
                'image1': int(len(corners1) if corners1 is not None else 0),
                'image2': int(len(corners2) if corners2 is not None else 0)
            },
            'contours': {
                'image1': int(len(contours1)),
                'image2': int(len(contours2))
            },
            'edge_difference_pixels': int(np.count_nonzero(edge_diff))
        }
        
        return {
            'edges1': edges1,
            'edges2': edges2,
            'edge_diff': edge_diff,
            'corners1': corners1,
            'corners2': corners2,
            'contours1': contours1,
            'contours2': contours2,
            'stats': feature_stats
        }
    
    def find_difference_regions(self, thresh: np.ndarray) -> List[Dict]:
        """Find and analyze regions of significant differences."""
        print("📍 Identifying difference regions...")
        
        # Find contours of difference regions
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        regions = []
        for i, contour in enumerate(contours):
            area = cv2.contourArea(contour)
            
            # Filter out small noise
            if area < self.contour_min_area:
                continue
            
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            
            # Calculate region properties
            perimeter = cv2.arcLength(contour, True)
            aspect_ratio = w / h if h > 0 else 0
            
            regions.append({
                'id': int(i),
                'area': float(area),
                'perimeter': float(perimeter),
                'bounding_box': (int(x), int(y), int(w), int(h)),
                'aspect_ratio': float(aspect_ratio),
                'center': (int(x + w//2), int(y + h//2))
            })
        
        # Sort regions by area (largest first)
        regions.sort(key=lambda r: r['area'], reverse=True)
        
        return regions
    
    def create_heatmap_visualization(self, diff: np.ndarray) -> np.ndarray:
        """Create a heatmap visualization of differences."""
        print("🌡️ Creating difference heatmap...")
        
        # Convert difference to intensity
        diff_intensity = np.mean(diff, axis=2)
        
        # Normalize to 0-255 range
        diff_normalized = cv2.normalize(diff_intensity, None, 0, 255, cv2.NORM_MINMAX)
        
        # Apply colormap for heatmap
        heatmap = cv2.applyColorMap(diff_normalized.astype(np.uint8), cv2.COLORMAP_JET)
        heatmap_rgb = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        
        return heatmap_rgb
    
    def create_overlay_visualization(self, img1: np.ndarray, img2: np.ndarray, 
                                   diff_regions: List[Dict]) -> np.ndarray:
        """Create an overlay visualization highlighting differences."""
        print("🎨 Creating overlay visualization...")
        
        # Create base image (blend of both images)
        overlay = cv2.addWeighted(img1, 0.5, img2, 0.5, 0)
        
        # Draw difference regions
        for region in diff_regions:
            x, y, w, h = region['bounding_box']
            
            # Color based on region size
            if region['area'] > 5000:
                color = self.colors['changed']  # Large changes
            elif region['area'] > 1000:
                color = self.colors['added']    # Medium changes
            else:
                color = self.colors['removed']  # Small changes
            
            # Draw rectangle
            cv2.rectangle(overlay, (x, y), (x + w, y + h), color, 2)
            
            # Add label
            label = f"Area: {region['area']}"
            cv2.putText(overlay, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        
        return overlay
    
    def generate_comparison_grid(self, img1: np.ndarray, img2: np.ndarray, 
                               diff: np.ndarray, heatmap: np.ndarray, 
                               overlay: np.ndarray) -> np.ndarray:
        """Generate a comprehensive comparison grid."""
        print("📊 Creating comparison grid...")
        
        # Create 2x3 grid
        h, w = img1.shape[:2]
        grid = np.zeros((h * 2, w * 3, 3), dtype=np.uint8)
        
        # Top row: Original images and difference
        grid[0:h, 0:w] = img1
        grid[0:h, w:2*w] = img2
        grid[0:h, 2*w:3*w] = diff
        
        # Bottom row: Heatmap, overlay, and combined analysis
        grid[h:2*h, 0:w] = heatmap
        grid[h:2*h, w:2*w] = overlay
        
        # Create combined analysis view
        combined = cv2.addWeighted(img1, 0.3, heatmap, 0.7, 0)
        grid[h:2*h, 2*w:3*w] = combined
        
        # Add labels
        labels = [
            "Storefront", "Backoffice", "Pixel Difference",
            "Difference Heatmap", "Region Overlay", "Combined Analysis"
        ]
        
        positions = [
            (10, 30), (w + 10, 30), (2*w + 10, 30),
            (10, h + 30), (w + 10, h + 30), (2*w + 10, h + 30)
        ]
        
        for label, pos in zip(labels, positions):
            cv2.putText(grid, label, pos, cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.putText(grid, label, pos, cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 1)
        
        return grid
    
    def save_analysis_results(self, results: Dict, timestamp: str):
        """Save all analysis results to files."""
        print("💾 Saving analysis results...")
        
        # Save images
        cv2.imwrite(str(self.output_dir / f"pixel_difference_{timestamp}.png"), 
                   cv2.cvtColor(results['pixel_diff'], cv2.COLOR_RGB2BGR))
        
        cv2.imwrite(str(self.output_dir / f"heatmap_{timestamp}.png"), 
                   cv2.cvtColor(results['heatmap'], cv2.COLOR_RGB2BGR))
        
        cv2.imwrite(str(self.output_dir / f"overlay_{timestamp}.png"), 
                   cv2.cvtColor(results['overlay'], cv2.COLOR_RGB2BGR))
        
        cv2.imwrite(str(self.output_dir / f"comparison_grid_{timestamp}.png"), 
                   cv2.cvtColor(results['grid'], cv2.COLOR_RGB2BGR))
        
        # Save edge analysis
        cv2.imwrite(str(self.output_dir / f"edge_difference_{timestamp}.png"), 
                   results['features']['edge_diff'])
        
        # Save statistical analysis as JSON
        stats_file = self.output_dir / f"analysis_stats_{timestamp}.json"
        with open(stats_file, 'w') as f:
            json.dump(results['stats'], f, indent=2)
        
        return {
            'pixel_diff': f"pixel_difference_{timestamp}.png",
            'heatmap': f"heatmap_{timestamp}.png",
            'overlay': f"overlay_{timestamp}.png",
            'grid': f"comparison_grid_{timestamp}.png",
            'edge_diff': f"edge_difference_{timestamp}.png",
            'stats': f"analysis_stats_{timestamp}.json"
        }
    
    def generate_html_report(self, results: Dict, saved_files: Dict, timestamp: str):
        """Generate comprehensive HTML report."""
        print("📝 Generating HTML report...")
        
        stats = results['stats']
        
        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OpenCV Chat GUI Analysis Report</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f7fa;
            color: #333;
        }}
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #2c3e50;
            text-align: center;
            margin-bottom: 10px;
            font-size: 2.5em;
        }}
        .timestamp {{
            text-align: center;
            color: #7f8c8d;
            margin-bottom: 30px;
            font-size: 1.1em;
        }}
        .section {{
            margin-bottom: 40px;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }}
        .section h2 {{
            color: #2c3e50;
            margin-top: 0;
            font-size: 1.8em;
        }}
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }}
        .stat-card {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }}
        .stat-value {{
            font-size: 2.5em;
            font-weight: bold;
            color: #3498db;
        }}
        .stat-label {{
            font-size: 0.9em;
            color: #7f8c8d;
            margin-top: 5px;
        }}
        .image-container {{
            text-align: center;
            margin: 20px 0;
        }}
        .image-container img {{
            max-width: 100%;
            border: 2px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }}
        .image-title {{
            font-weight: bold;
            margin: 15px 0 10px 0;
            color: #2c3e50;
            font-size: 1.2em;
        }}
        .regions-table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        .regions-table th,
        .regions-table td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        .regions-table th {{
            background-color: #3498db;
            color: white;
        }}
        .regions-table tr:hover {{
            background-color: #f5f5f5;
        }}
        .analysis-summary {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
        }}
        .analysis-summary h3 {{
            margin-top: 0;
            font-size: 1.5em;
        }}
        .similarity-bar {{
            width: 100%;
            height: 30px;
            background-color: rgba(255,255,255,0.3);
            border-radius: 15px;
            overflow: hidden;
            margin: 15px 0;
        }}
        .similarity-fill {{
            height: 100%;
            background: linear-gradient(90deg, #e74c3c 0%, #f39c12 50%, #27ae60 100%);
            border-radius: 15px;
            transition: width 0.5s ease;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🔬 OpenCV Chat GUI Analysis Report</h1>
        <div class="timestamp">Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
        
        <div class="analysis-summary">
            <h3>📊 Overall Similarity Analysis</h3>
            <p><strong>Visual Similarity:</strong> {stats['pixel']['similarity_percentage']:.2f}%</p>
            <div class="similarity-bar">
                <div class="similarity-fill" style="width: {stats['pixel']['similarity_percentage']:.1f}%"></div>
            </div>
            <p><strong>Different Pixels:</strong> {stats['pixel']['different_pixels']:,} out of {stats['pixel']['total_pixels']:,} total pixels</p>
            {f"<p><strong>Structural Similarity (SSIM):</strong> {stats['ssim']['similarity_index']:.4f}</p>" if 'ssim' in stats else ""}
        </div>
        
        <div class="section">
            <h2>📈 Statistical Analysis</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">{stats['pixel']['similarity_percentage']:.1f}%</div>
                    <div class="stat-label">Pixel Similarity</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{len(stats['regions'])}</div>
                    <div class="stat-label">Different Regions</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{stats['features']['corners']['image1']}</div>
                    <div class="stat-label">Storefront Features</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{stats['features']['corners']['image2']}</div>
                    <div class="stat-label">Backoffice Features</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>🎨 Visual Comparison</h2>
            <div class="image-container">
                <div class="image-title">Comprehensive Comparison Grid</div>
                <img src="{saved_files['grid']}" alt="Comparison Grid">
            </div>
        </div>
        
        <div class="section">
            <h2>🌡️ Difference Heatmap</h2>
            <div class="image-container">
                <div class="image-title">Pixel Difference Intensity Map</div>
                <img src="{saved_files['heatmap']}" alt="Difference Heatmap">
                <p>Red/Yellow areas indicate significant visual differences between the chat widgets.</p>
            </div>
        </div>
        
        <div class="section">
            <h2>📍 Region Analysis</h2>
            <div class="image-container">
                <div class="image-title">Difference Regions Overlay</div>
                <img src="{saved_files['overlay']}" alt="Region Overlay">
            </div>
            
            <h3>Detected Difference Regions</h3>
            <table class="regions-table">
                <thead>
                    <tr>
                        <th>Region #</th>
                        <th>Area (pixels)</th>
                        <th>Position (x, y)</th>
                        <th>Size (w × h)</th>
                        <th>Aspect Ratio</th>
                    </tr>
                </thead>
                <tbody>
"""
        
        # Add region data to table
        for i, region in enumerate(stats['regions'][:10]):  # Show top 10 regions
            x, y, w, h = region['bounding_box']
            html_content += f"""
                    <tr>
                        <td>Region {i+1}</td>
                        <td>{region['area']:,}</td>
                        <td>({x}, {y})</td>
                        <td>{w} × {h}</td>
                        <td>{region['aspect_ratio']:.2f}</td>
                    </tr>
"""
        
        html_content += f"""
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>🎯 Edge Detection Analysis</h2>
            <div class="image-container">
                <div class="image-title">Edge Difference Analysis</div>
                <img src="{saved_files['edge_diff']}" alt="Edge Differences">
                <p>White areas show differences in edge structures between the two chat widgets.</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">{stats['features']['contours']['image1']}</div>
                    <div class="stat-label">Storefront Contours</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{stats['features']['contours']['image2']}</div>
                    <div class="stat-label">Backoffice Contours</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{stats['features']['edge_difference_pixels']:,}</div>
                    <div class="stat-label">Edge Diff Pixels</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>🔬 Technical Details</h2>
            <h3>Color Channel Analysis</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">{stats['pixel']['avg_difference']['red']:.1f}</div>
                    <div class="stat-label">Red Channel Diff</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{stats['pixel']['avg_difference']['green']:.1f}</div>
                    <div class="stat-label">Green Channel Diff</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{stats['pixel']['avg_difference']['blue']:.1f}</div>
                    <div class="stat-label">Blue Channel Diff</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{stats['pixel']['avg_difference']['overall']:.1f}</div>
                    <div class="stat-label">Overall Avg Diff</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>📋 Analysis Summary</h2>
            <h3>Key Findings:</h3>
            <ul>
"""
        
        # Add dynamic analysis findings
        similarity = stats['pixel']['similarity_percentage']
        
        if similarity > 95:
            html_content += "<li>✅ <strong>Excellent Consistency:</strong> Chat widgets are visually very similar</li>"
        elif similarity > 85:
            html_content += "<li>✅ <strong>Good Consistency:</strong> Minor visual differences detected</li>"
        elif similarity > 70:
            html_content += "<li>⚠️ <strong>Moderate Differences:</strong> Some visual inconsistencies present</li>"
        else:
            html_content += "<li>❌ <strong>Significant Differences:</strong> Major visual inconsistencies detected</li>"
        
        if len(stats['regions']) == 0:
            html_content += "<li>✅ No significant difference regions detected</li>"
        elif len(stats['regions']) < 5:
            html_content += f"<li>⚠️ {len(stats['regions'])} difference regions detected - minor inconsistencies</li>"
        else:
            html_content += f"<li>❌ {len(stats['regions'])} difference regions detected - review needed</li>"
        
        # Feature comparison
        corner_diff = abs(stats['features']['corners']['image1'] - stats['features']['corners']['image2'])
        if corner_diff < 5:
            html_content += "<li>✅ Similar feature complexity in both widgets</li>"
        else:
            html_content += f"<li>⚠️ Feature complexity differs by {corner_diff} corner points</li>"
        
        html_content += f"""
            </ul>
            
            <h3>Recommendations:</h3>
            <ul>
                <li>📊 Use this analysis to identify specific areas needing alignment</li>
                <li>🎨 Focus on regions with high difference intensity (red/yellow in heatmap)</li>
                <li>🔍 Review edge differences for structural inconsistencies</li>
                <li>📏 Consider standardizing dimensions and spacing</li>
                <li>🎯 Target the largest difference regions first for maximum impact</li>
            </ul>
        </div>
        
        <div class="section">
            <h2>📁 Generated Files</h2>
            <ul>
                <li><strong>Pixel Difference:</strong> {saved_files['pixel_diff']}</li>
                <li><strong>Heatmap:</strong> {saved_files['heatmap']}</li>
                <li><strong>Region Overlay:</strong> {saved_files['overlay']}</li>
                <li><strong>Comparison Grid:</strong> {saved_files['grid']}</li>
                <li><strong>Edge Analysis:</strong> {saved_files['edge_diff']}</li>
                <li><strong>Statistical Data:</strong> {saved_files['stats']}</li>
            </ul>
        </div>
    </div>
</body>
</html>
"""
        
        report_file = self.output_dir / f"opencv_analysis_report_{timestamp}.html"
        with open(report_file, 'w') as f:
            f.write(html_content)
        
        return report_file
    
    def analyze_chat_widgets(self, storefront_image: str, backoffice_image: str) -> Dict:
        """Main analysis function - comprehensive OpenCV-based comparison."""
        print("🚀 Starting OpenCV Chat Widget Analysis")
        print("=" * 50)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Load and preprocess images
        img1, img1_gray = self.load_and_preprocess_image(storefront_image)
        img2, img2_gray = self.load_and_preprocess_image(backoffice_image)
        
        print(f"📏 Image dimensions: {img1.shape}")
        
        # Pixel-level difference analysis
        pixel_diff, thresh, pixel_stats = self.calculate_pixel_difference(img1, img2)
        
        # Structural similarity analysis (if available)
        ssim_score = 0.0
        ssim_map = np.zeros_like(img1_gray)
        if ssim is not None:
            ssim_score, ssim_map = self.calculate_structural_similarity(img1_gray, img2_gray)
        
        # Feature detection and analysis
        features = self.detect_feature_differences(img1_gray, img2_gray)
        
        # Find difference regions
        diff_regions = self.find_difference_regions(thresh)
        
        # Create visualizations
        heatmap = self.create_heatmap_visualization(pixel_diff)
        overlay = self.create_overlay_visualization(img1, img2, diff_regions)
        comparison_grid = self.generate_comparison_grid(img1, img2, pixel_diff, heatmap, overlay)
        
        # Compile comprehensive results
        results = {
            'pixel_diff': pixel_diff,
            'heatmap': heatmap,
            'overlay': overlay,
            'grid': comparison_grid,
            'features': features,
            'stats': {
                'pixel': pixel_stats,
                'ssim': {
                    'similarity_index': ssim_score,
                    'available': ssim is not None
                },
                'features': features['stats'],
                'regions': diff_regions,
                'analysis_timestamp': timestamp
            }
        }
        
        # Save all results
        saved_files = self.save_analysis_results(results, timestamp)
        
        # Generate comprehensive report
        report_file = self.generate_html_report(results, saved_files, timestamp)
        
        print("✅ Analysis completed successfully!")
        print(f"📁 Results saved to: {self.output_dir}")
        print(f"📄 Report: {report_file}")
        
        return results


def main():
    """Main execution function."""
    print("🔬 OpenCV Chat Widget Visual Analysis Tool")
    print("=" * 45)
    
    # Check for required images
    screenshots_dir = Path("screenshots_v2.1.0")
    if not screenshots_dir.exists():
        screenshots_dir = Path("screenshots_fixed")
        if not screenshots_dir.exists():
            screenshots_dir = Path("screenshots")
    
    if not screenshots_dir.exists():
        print("❌ No screenshots directory found.")
        print("💡 Please run the screenshot comparison first:")
        print("   python3 screenshot_chat_comparison.py")
        return 1
    
    # Find the latest storefront and backoffice images
    storefront_images = list(screenshots_dir.glob("storefront_*.png"))
    backoffice_images = list(screenshots_dir.glob("backoffice_*.png"))
    
    if not storefront_images or not backoffice_images:
        print("❌ Could not find both storefront and backoffice images.")
        print(f"📁 Looking in: {screenshots_dir}")
        print(f"🔍 Found: {len(storefront_images)} storefront, {len(backoffice_images)} backoffice")
        return 1
    
    # Use the most recent interaction images, or fall back to opened/initial
    def get_best_image(images, preferred_types=['interaction', 'opened', 'initial']):
        for img_type in preferred_types:
            matching = [img for img in images if img_type in img.name]
            if matching:
                return max(matching, key=lambda f: f.stat().st_mtime)
        return max(images, key=lambda f: f.stat().st_mtime)
    
    storefront_img = get_best_image(storefront_images)
    backoffice_img = get_best_image(backoffice_images)
    
    print(f"📸 Analyzing:")
    print(f"  Storefront: {storefront_img.name}")
    print(f"  Backoffice:  {backoffice_img.name}")
    print()
    
    # Create analyzer and run analysis
    analyzer = OpenCVChatAnalyzer()
    
    try:
        results = analyzer.analyze_chat_widgets(str(storefront_img), str(backoffice_img))
        
        # Print summary
        stats = results['stats']
        print("\n📊 Analysis Summary:")
        print(f"  Similarity: {stats['pixel']['similarity_percentage']:.2f}%")
        print(f"  Different regions: {len(stats['regions'])}")
        print(f"  Largest difference: {stats['regions'][0]['area'] if stats['regions'] else 0} pixels")
        
        return 0
        
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())