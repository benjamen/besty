# besty/besty/grocery.py
import frappe

@frappe.whitelist()
def get_items():
    items = frappe.get_all('Grocery Item', 
        fields=['name1 as name', 'completed'],
        order_by='creation desc'
    )
    return items

@frappe.whitelist()
def add_item(name):
    doc = frappe.new_doc('Grocery Item')
    doc.name1 = name
    doc.completed = 0
    doc.insert()
    return doc

@frappe.whitelist()
def update_item(name, completed):
    doc = frappe.get_doc('Grocery Item', {'name1': name})
    doc.completed = completed
    doc.save()
    return doc

@frappe.whitelist()
def delete_item(name):
    frappe.delete_doc('Grocery Item', {'name1': name})
    return {'message': 'Item deleted'}