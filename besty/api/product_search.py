import frappe

@frappe.whitelist()
def fetch_comparison(product_name):
    """
    Example API to return mock price data for a product.
    """
    # Mock data: Replace with actual scraping or API integration
    results = [
        {"site": "Amazon", "price": 19.99, "shipping": 10.00, "total_price": 29.99},
        {"site": "eBay", "price": 18.50, "shipping": 12.00, "total_price": 30.50},
        {"site": "PriceSpy", "price": 20.00, "shipping": 5.00, "total_price": 25.00},
    ]
    return results
