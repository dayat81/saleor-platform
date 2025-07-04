# Chat Widget Screenshot Comparison Tools

This directory contains automated tools to capture and compare chat widget implementations between the Saleor storefront and backoffice applications.

## 📁 Files Overview

### Main Scripts
- **`screenshot_chat_comparison.py`** - Advanced Selenium-based screenshot tool with full interaction testing
- **`quick_screenshot.py`** - Lightweight screenshot tool using system utilities
- **`view_comparison_results.py`** - Results viewer and report opener
- **`setup_screenshot_tools.sh`** - Installation script for dependencies

### Configuration
- **`requirements.txt`** - Python dependencies
- **`README.md`** - This documentation

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install system packages
sudo apt-get update
sudo apt-get install python3-pip wkhtmltopdf xvfb google-chrome-stable

# Install Python packages
pip3 install --break-system-packages selenium pillow webdriver-manager
```

### 2. Run Screenshot Comparison
```bash
# Quick comparison (basic screenshots)
python3 quick_screenshot.py

# Full comparison (with chat interactions)
xvfb-run -a python3 screenshot_chat_comparison.py

# View results
python3 view_comparison_results.py
```

## 🔧 Tools Description

### screenshot_chat_comparison.py
**Advanced Selenium-based tool** that:
- ✅ Opens both storefront and backoffice URLs
- ✅ Captures screenshots in multiple states (initial, opened, interaction)
- ✅ Automatically finds and clicks chat buttons
- ✅ Sends test messages and captures responses
- ✅ Creates side-by-side comparison images
- ✅ Generates comprehensive HTML reports
- ✅ Supports Indonesian language testing

**Usage:**
```bash
# Basic usage
xvfb-run -a python3 screenshot_chat_comparison.py

# Custom output directory
xvfb-run -a python3 screenshot_chat_comparison.py --output-dir my_screenshots

# Custom URLs
xvfb-run -a python3 screenshot_chat_comparison.py \
  --storefront-url "http://custom-storefront.com" \
  --backoffice-url "http://custom-backoffice.com"
```

### quick_screenshot.py
**Lightweight tool** using system utilities:
- ✅ Fast execution without browser automation
- ✅ Uses wkhtmltopdf, cutycapt, or firefox --headless
- ✅ Basic accessibility checking
- ✅ Simple HTML report generation
- ✅ Minimal dependencies

**Usage:**
```bash
python3 quick_screenshot.py
```

### view_comparison_results.py
**Results viewer** that:
- ✅ Lists all captured screenshots
- ✅ Shows file sizes and types
- ✅ Provides quick analysis
- ✅ Opens HTML reports in browser

## 📊 Output Files

### Screenshots
- **`storefront_*.png`** - Storefront application screenshots
- **`backoffice_*.png`** - Backoffice application screenshots  
- **`comparison_*.png`** - Side-by-side comparison images

### Reports
- **`chat_comparison_report_*.html`** - Comprehensive comparison report
- **`quick_comparison_report_*.html`** - Basic comparison report

## 🎯 Use Cases

### 1. Development Testing
```bash
# Test after making changes to chat widgets
xvfb-run -a python3 screenshot_chat_comparison.py
```

### 2. Quality Assurance
```bash
# Regular comparison for consistency checks
python3 quick_screenshot.py
```

### 3. Documentation
```bash
# Generate screenshots for documentation
xvfb-run -a python3 screenshot_chat_comparison.py --output-dir docs/screenshots
```

### 4. Issue Reporting
```bash
# Capture evidence of chat widget issues
python3 view_comparison_results.py
```

## 🔍 Comparison Features

### Visual Elements Tested
- ✅ Chat button placement and styling
- ✅ Chat widget dimensions and appearance
- ✅ Message display and formatting
- ✅ Quick action buttons
- ✅ Color schemes and branding
- ✅ Indonesian language support

### Interaction Testing
- ✅ Chat button click responsiveness
- ✅ Widget opening/closing animations
- ✅ Message input and submission
- ✅ Response handling
- ✅ Error state handling

### Consistency Checks
- ✅ Size and positioning alignment
- ✅ Brand consistency between apps
- ✅ Functionality parity
- ✅ Multilingual support

## 🛠️ Troubleshooting

### Chrome WebDriver Issues
```bash
# Clear old drivers
rm -rf ~/.wdm/drivers/

# Re-run with fresh driver download
xvfb-run -a python3 screenshot_chat_comparison.py
```

### Permission Issues
```bash
# Fix file permissions
chmod +x setup_screenshot_tools.sh
sudo ./setup_screenshot_tools.sh
```

### Network Issues
```bash
# Test URL accessibility
curl -I http://storefront-dev.aksa.ai/
curl -I http://backoffice-dev.aksa.ai/
```

## 📈 Example Results

The tools generate detailed comparisons showing:

1. **Initial State**: Both applications with chat buttons visible
2. **Opened State**: Chat widgets expanded and ready for interaction  
3. **Interaction State**: After sending test messages
4. **Side-by-Side**: Direct visual comparison
5. **Analysis Report**: Detailed findings and recommendations

## 🚀 Advanced Usage

### Custom Test Messages
Modify the test messages in `screenshot_chat_comparison.py`:
```python
test_message = "halo"  # Indonesian greeting
test_message = "show menu"  # English command
```

### Screenshot Configuration
Adjust capture settings:
```python
self.window_width = 1920
self.window_height = 1080
self.chat_wait_time = 3
```

### Browser Options
Configure Chrome options in `_setup_chrome_options()`:
```python
options.add_argument("--window-size=1920,1080")
options.add_argument("--disable-gpu")
```

## 📋 Dependencies

### System Packages
- `python3` (3.8+)
- `python3-pip`
- `wkhtmltopdf`
- `xvfb` (for headless operation)
- `google-chrome-stable`

### Python Packages
- `selenium` (4.15.0+)
- `pillow` (10.0.0+)
- `webdriver-manager` (4.0.0+)

## ✅ Verification

After running the tools, verify:
1. Screenshots are generated in the output directory
2. HTML reports open correctly in browser
3. Comparison images show both applications
4. Chat interactions are properly captured
5. Indonesian language responses are working

## 🤝 Contributing

To extend these tools:
1. Add new test scenarios in `screenshot_chat_comparison.py`
2. Enhance the HTML report template
3. Add support for additional browsers
4. Implement automated difference detection
5. Add performance timing measurements

---

**Generated by:** Chat Widget Screenshot Comparison Tools  
**Last Updated:** July 2025