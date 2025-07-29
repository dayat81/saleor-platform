#!/usr/bin/env python3
"""
Saleor Serverless Deployment Verification Script

This script verifies all deployed Saleor services on Google Cloud Run.
It checks connectivity, health, and basic functionality of each endpoint.
"""

import requests
import json
import time
import sys
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from urllib.parse import urljoin


@dataclass
class ServiceEndpoint:
    name: str
    url: str
    description: str
    health_path: Optional[str] = None
    expected_status: int = 200


class SaleorEndpointVerifier:
    def __init__(self):
        self.services = [
            ServiceEndpoint(
                name="API (GraphQL)",
                url="https://saleor-api-371986630216.us-central1.run.app",
                description="Core Saleor GraphQL API",
                health_path="/graphql/"
            ),
            ServiceEndpoint(
                name="Dashboard",
                url="https://saleor-dashboard-371986630216.us-central1.run.app",
                description="Admin dashboard interface"
            ),
            ServiceEndpoint(
                name="Storefront",
                url="https://saleor-storefront-371986630216.us-central1.run.app",
                description="Customer-facing storefront"
            ),
            ServiceEndpoint(
                name="Backoffice",
                url="https://saleor-backoffice-371986630216.us-central1.run.app",
                description="F&B management interface"
            ),
        ]
        
        self.session = requests.Session()
        self.session.timeout = 30
        self.results = []
        
    def print_header(self):
        """Print verification header"""
        print("=" * 80)
        print("🔍 SALEOR SERVERLESS ENDPOINT VERIFICATION")
        print("=" * 80)
        print(f"⏰ Started at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
    def print_footer(self):
        """Print verification summary"""
        print("\n" + "=" * 80)
        print("📊 VERIFICATION SUMMARY")
        print("=" * 80)
        
        total_services = len(self.results)
        healthy_services = sum(1 for r in self.results if r['status'] == 'healthy')
        failed_services = total_services - healthy_services
        
        print(f"Total Services: {total_services}")
        print(f"✅ Healthy: {healthy_services}")
        print(f"❌ Failed: {failed_services}")
        
        if failed_services == 0:
            print("\n🎉 All services are healthy and responding correctly!")
            return True
        else:
            print(f"\n⚠️  {failed_services} service(s) need attention.")
            return False
    
    def test_http_connectivity(self, service: ServiceEndpoint) -> Tuple[bool, str, Dict]:
        """Test basic HTTP connectivity to a service"""
        try:
            url = service.url
            if service.health_path:
                url = urljoin(service.url, service.health_path)
                
            response = self.session.get(url, allow_redirects=True)
            
            if response.status_code == service.expected_status:
                return True, f"✅ HTTP {response.status_code}", {
                    'status_code': response.status_code,
                    'response_time': response.elapsed.total_seconds(),
                    'content_length': len(response.content)
                }
            else:
                return False, f"❌ HTTP {response.status_code} (expected {service.expected_status})", {
                    'status_code': response.status_code,
                    'response_time': response.elapsed.total_seconds()
                }
                
        except requests.exceptions.RequestException as e:
            return False, f"❌ Connection failed: {str(e)}", {}
    
    def test_graphql_endpoint(self, service: ServiceEndpoint) -> Tuple[bool, str, Dict]:
        """Test GraphQL endpoint with introspection query"""
        if "api" not in service.name.lower():
            return True, "⏭️  Not a GraphQL service", {}
            
        try:
            graphql_url = urljoin(service.url, "/graphql/")
            
            # Simple introspection query
            query = {
                "query": """
                {
                    __schema {
                        queryType {
                            name
                        }
                    }
                }
                """
            }
            
            response = self.session.post(
                graphql_url,
                json=query,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if 'data' in data and '__schema' in data['data']:
                        return True, "✅ GraphQL responding", {
                            'schema_available': True,
                            'response_time': response.elapsed.total_seconds()
                        }
                    else:
                        return False, "❌ Invalid GraphQL response", {
                            'response': data
                        }
                except json.JSONDecodeError:
                    return False, "❌ Invalid JSON response", {}
            else:
                return False, f"❌ HTTP {response.status_code}", {
                    'status_code': response.status_code
                }
                
        except requests.exceptions.RequestException as e:
            return False, f"❌ GraphQL test failed: {str(e)}", {}
    
    def test_frontend_loading(self, service: ServiceEndpoint) -> Tuple[bool, str, Dict]:
        """Test if frontend services load properly"""
        if "api" in service.name.lower():
            return True, "⏭️  Not a frontend service", {}
            
        try:
            response = self.session.get(service.url)
            
            if response.status_code == 200:
                content = response.text
                if content:
                    content_lower = content.lower()
                    
                    # Check for common frontend indicators
                    indicators = ['<!doctype html', '<html', '<head>', '<body>', 'script', 'stylesheet']
                    found_indicators = sum(1 for indicator in indicators if indicator in content_lower)
                    
                    if found_indicators >= 3:
                        return True, "✅ Frontend loaded", {
                            'html_indicators': found_indicators,
                            'content_length': len(response.content),
                            'response_time': response.elapsed.total_seconds()
                        }
                    else:
                        return False, "❌ Invalid frontend response", {
                            'html_indicators': found_indicators
                        }
                else:
                    return False, "❌ Empty response", {}
            else:
                return False, f"❌ HTTP {response.status_code}", {
                    'status_code': response.status_code
                }
                
        except requests.exceptions.RequestException as e:
            return False, f"❌ Frontend test failed: {str(e)}", {}
    
    def verify_service(self, service: ServiceEndpoint) -> Dict:
        """Verify a single service with multiple tests"""
        print(f"\n🔍 Verifying: {service.name}")
        print(f"   URL: {service.url}")
        print(f"   Description: {service.description}")
        
        result = {
            'name': service.name,
            'url': service.url,
            'description': service.description,
            'tests': {},
            'status': 'unknown',
            'overall_healthy': False
        }
        
        # Test 1: HTTP Connectivity
        print("   Testing HTTP connectivity...", end=" ")
        http_ok, http_msg, http_data = self.test_http_connectivity(service)
        result['tests']['http'] = {'success': http_ok, 'message': http_msg, 'data': http_data}
        print(http_msg)
        
        # Test 2: GraphQL (if applicable)
        print("   Testing GraphQL endpoint...", end=" ")
        gql_ok, gql_msg, gql_data = self.test_graphql_endpoint(service)
        result['tests']['graphql'] = {'success': gql_ok, 'message': gql_msg, 'data': gql_data}
        print(gql_msg)
        
        # Test 3: Frontend Loading (if applicable)
        print("   Testing frontend loading...", end=" ")
        fe_ok, fe_msg, fe_data = self.test_frontend_loading(service)
        result['tests']['frontend'] = {'success': fe_ok, 'message': fe_msg, 'data': fe_data}
        print(fe_msg)
        
        # Determine overall health
        critical_tests = ['http']
        if "api" in service.name.lower():
            critical_tests.append('graphql')
        else:
            critical_tests.append('frontend')
            
        all_critical_passed = all(
            result['tests'][test]['success'] for test in critical_tests
        )
        
        if all_critical_passed:
            result['status'] = 'healthy'
            result['overall_healthy'] = True
            print(f"   ✅ {service.name} is healthy")
        else:
            result['status'] = 'unhealthy'
            result['overall_healthy'] = False
            print(f"   ❌ {service.name} has issues")
            
        return result
    
    def test_service_integration(self) -> Dict:
        """Test integration between services"""
        print(f"\n🔗 Testing Service Integration")
        
        # Find API service
        api_service = None
        for service in self.services:
            if "api" in service.name.lower():
                api_service = service
                break
                
        if not api_service:
            return {
                'success': False,
                'message': "❌ API service not found",
                'data': {}
            }
        
        try:
            # Test basic GraphQL query that should work on any Saleor instance
            graphql_url = urljoin(api_service.url, "/graphql/")
            
            query = {
                "query": """
                {
                    shop {
                        name
                        description
                    }
                }
                """
            }
            
            print("   Testing shop query...", end=" ")
            response = self.session.post(
                graphql_url,
                json=query,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if 'data' in data and 'shop' in data['data']:
                        print("✅ Shop data accessible")
                        return {
                            'success': True,
                            'message': "✅ Integration test passed",
                            'data': {
                                'shop_data': data['data']['shop'],
                                'response_time': response.elapsed.total_seconds()
                            }
                        }
                    else:
                        print("❌ Invalid shop response")
                        return {
                            'success': False,
                            'message': "❌ Invalid shop response",
                            'data': {'response': data}
                        }
                except json.JSONDecodeError:
                    print("❌ Invalid JSON")
                    return {
                        'success': False,
                        'message': "❌ Invalid JSON response",
                        'data': {}
                    }
            else:
                print(f"❌ HTTP {response.status_code}")
                return {
                    'success': False,
                    'message': f"❌ HTTP {response.status_code}",
                    'data': {'status_code': response.status_code}
                }
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed: {str(e)}")
            return {
                'success': False,
                'message': f"❌ Integration test failed: {str(e)}",
                'data': {}
            }
    
    def verify_all_endpoints(self) -> bool:
        """Verify all Saleor endpoints"""
        self.print_header()
        
        # Verify each service
        for service in self.services:
            result = self.verify_service(service)
            self.results.append(result)
        
        # Test integration
        integration_result = self.test_service_integration()
        
        # Print detailed results
        print("\n" + "=" * 80)
        print("📋 DETAILED RESULTS")
        print("=" * 80)
        
        for result in self.results:
            status_icon = "✅" if result['overall_healthy'] else "❌"
            print(f"\n{status_icon} {result['name']}")
            print(f"   URL: {result['url']}")
            print(f"   Status: {result['status'].upper()}")
            
            for test_name, test_result in result['tests'].items():
                if test_result['message'] != "⏭️  Not a GraphQL service" and test_result['message'] != "⏭️  Not a frontend service":
                    print(f"   {test_name.title()}: {test_result['message']}")
                    if test_result['data']:
                        for key, value in test_result['data'].items():
                            if key == 'response_time':
                                print(f"      Response time: {value:.3f}s")
                            elif key == 'content_length':
                                print(f"      Content length: {value:,} bytes")
                            elif key == 'status_code':
                                print(f"      Status code: {value}")
        
        print(f"\n🔗 Integration Test: {integration_result['message']}")
        
        # Print summary
        all_healthy = self.print_footer()
        
        return all_healthy

    def save_results(self, filename: str = "endpoint_verification_results.json"):
        """Save verification results to JSON file"""
        output = {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'summary': {
                'total_services': len(self.results),
                'healthy_services': sum(1 for r in self.results if r['status'] == 'healthy'),
                'failed_services': sum(1 for r in self.results if r['status'] == 'unhealthy')
            },
            'services': self.results
        }
        
        with open(filename, 'w') as f:
            json.dump(output, f, indent=2)
            
        print(f"\n💾 Results saved to: {filename}")


def main():
    """Main function"""
    verifier = SaleorEndpointVerifier()
    
    try:
        all_healthy = verifier.verify_all_endpoints()
        verifier.save_results()
        
        # Exit with appropriate code
        sys.exit(0 if all_healthy else 1)
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Verification interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n💥 Unexpected error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
