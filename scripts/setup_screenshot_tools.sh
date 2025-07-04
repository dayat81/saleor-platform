#!/bin/bash
# Setup script for chat screenshot comparison tools

set -e

echo "🔧 Setting up Chat Screenshot Comparison Tools"
echo "============================================="

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo "📦 Installing pip..."
    sudo apt-get update
    sudo apt-get install -y python3-pip
fi

echo "✅ pip3 found: $(pip3 --version)"

# Install Chrome if not present
if ! command -v google-chrome &> /dev/null; then
    echo "🌐 Installing Google Chrome..."
    
    # Add Google's signing key
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
    
    # Add Chrome repository
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
    
    # Update package list and install Chrome
    sudo apt-get update
    sudo apt-get install -y google-chrome-stable
fi

echo "✅ Google Chrome found: $(google-chrome --version)"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📖 Usage:"
echo "  python3 screenshot_chat_comparison.py"
echo "  python3 screenshot_chat_comparison.py --output-dir my_screenshots"
echo ""
echo "🎯 This will:"
echo "  1. Open both storefront and backoffice URLs"
echo "  2. Capture screenshots of chat widgets in different states"
echo "  3. Create side-by-side comparison images"
echo "  4. Generate an HTML report with all results"
echo ""