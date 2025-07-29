#!/usr/bin/env python3
"""
Simple Saleor Endpoint Verification Script
Tests all deployed Saleor services with basic health checks.
"""

import requests
import json
import time
import sys


def test_service(name, url, test_type="http"):
    """Test a single service endpoint"""
    print(f"Testing {name}... ", end="", flush=True)
    
    try:
        if test_type == "graphql":
            # Test GraphQL endpoint
            response = requests.post(
                f"{url}/graphql/",
                json={"query": "{ __schema { queryType { name } } }"},
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'data' in data and '__schema' in data['data']:
                    print(f"✅ GraphQL OK ({response.elapsed.total_seconds():.2f}s)")
                    return True
                else:
                    print(f"❌ Invalid GraphQL response")
                    return False
            else:
                print(f"❌ HTTP {response.status_code}")
                return False
                
        else:
            # Test HTTP endpoint
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                print(f"✅ HTTP OK ({response.elapsed.total_seconds():.2f}s)")
                return True
            else:
                print(f"❌ HTTP {response.status_code}")
                return False
                
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed: {str(e)}")
        return False


def main():
    """Main verification function"""
    print("🔍 SALEOR SERVERLESS ENDPOINT VERIFICATION")
    print("=" * 50)
    print(f"Started at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Define services to test
    services = [
        ("API (GraphQL)", "https://saleor-api-371986630216.us-central1.run.app", "graphql"),
        ("Dashboard", "https://saleor-dashboard-371986630216.us-central1.run.app", "http"),
        ("Storefront", "https://saleor-storefront-371986630216.us-central1.run.app", "http"),
        ("Backoffice", "https://saleor-backoffice-371986630216.us-central1.run.app", "http"),
    ]
    
    results = []
    
    # Test each service
    for name, url, test_type in services:
        success = test_service(name, url, test_type)
        results.append((name, url, success))
    
    # Test a basic GraphQL query
    print("\nTesting basic GraphQL functionality...")
    try:
        response = requests.post(
            "https://saleor-api-371986630216.us-central1.run.app/graphql/",
            json={"query": "{ shop { name description } }"},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if 'data' in data:
                if data['data']['shop']:
                    shop = data['data']['shop']
                    print(f"✅ Shop query OK - Name: {shop.get('name', 'N/A')}")
                else:
                    print("⚠️  Shop query returned null (migrations may be needed)")
            else:
                print("❌ Invalid shop query response")
        else:
            print(f"❌ Shop query failed: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ Shop query failed: {str(e)}")
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 SUMMARY")
    print("=" * 50)
    
    healthy_count = sum(1 for _, _, success in results if success)
    total_count = len(results)
    
    for name, url, success in results:
        status = "✅ HEALTHY" if success else "❌ FAILED"
        print(f"{name:<15} {status}")
        print(f"               {url}")
    
    print(f"\nTotal: {healthy_count}/{total_count} services healthy")
    
    if healthy_count == total_count:
        print("\n🎉 All services are responding correctly!")
        print("\n🔗 Quick Access Links:")
        print("   • GraphQL Playground: https://saleor-api-371986630216.us-central1.run.app/graphql/")
        print("   • Admin Dashboard: https://saleor-dashboard-371986630216.us-central1.run.app")
        print("   • Customer Storefront: https://saleor-storefront-371986630216.us-central1.run.app")
        print("   • F&B Backoffice: https://saleor-backoffice-371986630216.us-central1.run.app")
        return True
    else:
        print(f"\n⚠️  {total_count - healthy_count} service(s) need attention.")
        return False


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nVerification interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {str(e)}")
        sys.exit(1)
