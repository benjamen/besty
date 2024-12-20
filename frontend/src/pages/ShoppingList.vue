<template>
  <div class="container mx-auto p-6">
    <h2 class="text-2xl font-semibold mb-4">Manage Shopping Lists</h2>

    <!-- List of shopping lists -->
    <div class="bg-white shadow-md rounded-lg p-4 mb-6">
      <h3 class="text-xl font-medium mb-2">My Shopping Lists</h3>
      <ul class="list-disc list-inside">
        <li v-for="list in shoppingLists" :key="list.name" class="mb-2">
          <span>{{ list.list_name }}</span>
          <div class="mt-2 flex space-x-2">
            <button @click="viewShoppingList(list.name)" class="bg-blue-500 text-white px-4 py-2 rounded">View</button>
            <button @click="editShoppingList(list.name)" class="bg-yellow-500 text-white px-4 py-2 rounded">Edit</button>
          </div>
        </li>
      </ul>
      <button @click="createNewShoppingList" class="bg-green-500 text-white px-4 py-2 rounded">Create New List</button>
    </div>

    <!-- Add/Edit Shopping List -->
    <div v-if="editingList" class="bg-white shadow-md rounded-lg p-4">
      <h3 class="text-xl font-medium mb-4">{{ isEditing ? 'Edit Shopping List' : 'New Shopping List' }}</h3>
      <input v-model="currentList.list_name" placeholder="List Name" class="w-full p-2 border border-gray-300 rounded mb-4" />
      
      <table class="w-full table-auto border-collapse border border-gray-400">
        <thead>
          <tr>
            <th class="border border-gray-300 px-4 py-2">Product Name</th>
            <th class="border border-gray-300 px-4 py-2">Quantity</th>
            <th class="border border-gray-300 px-4 py-2">Unit Price</th>
            <th class="border border-gray-300 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in currentList.products" :key="index">
            <td class="border border-gray-300 px-4 py-2">{{ item.productname }}</td>
            <td class="border border-gray-300 px-4 py-2">
              <input v-model.number="item.quantity" type="number" min="1" class="w-full p-2 border border-gray-300 rounded" />
            </td>
            <td class="border border-gray-300 px-4 py-2">
              <input v-model.number="item.unit_price" type="number" min="0" step="0.01" class="w-full p-2 border border-gray-300 rounded" />
            </td>
            <td class="border border-gray-300 px-4 py-2">
              <button @click="removeProduct(index)" class="bg-red-500 text-white px-4 py-2 rounded">Remove</button>
            </td>
          </tr>
        </tbody>
      </table>
      <button @click="addProduct" class="bg-blue-500 text-white px-4 py-2 rounded mt-4">Add Product</button>
      <div class="mt-4 space-x-2">
        <button @click="saveShoppingList" class="bg-green-500 text-white px-4 py-2 rounded">Save List</button>
        <button @click="cancelEditing" class="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { createResource } from 'frappe-ui'

const shoppingLists = ref([])
const currentList = ref({
  list_name: '',
  products: [],
})
const editingList = ref(false)
const isEditing = ref(false)

// Create a resource for fetching shopping lists
let shoppingListResource = createResource({
  url: '/api/method/frappe.client.get_list',
  params: {
    doctype: 'Shopping List',
    filters: {
      owner: 'current_user', // Replace 'current_user' with the actual session user
    },
  },
})

// Fetch all shopping lists
const fetchShoppingLists = async () => {
  try {
    const response = await shoppingListResource.fetch()
    shoppingLists.value = response.message || []
  } catch (error) {
    console.error('Error fetching shopping lists:', error)
  }
}

// View shopping list
const viewShoppingList = async (name) => {
  try {
    const response = await shoppingListResource.fetch({ params: { doctype: 'Shopping List', name } })
    currentList.value = response.message
    editingList.value = true
    isEditing.value = false
  } catch (error) {
    console.error('Error viewing shopping list:', error)
  }
}

// Edit shopping list
const editShoppingList = async (name) => {
  try {
    const response = await shoppingListResource.fetch({ params: { doctype: 'Shopping List', name } })
    currentList.value = response.message
    editingList.value = true
    isEditing.value = true
  } catch (error) {
    console.error('Error editing shopping list:', error)
  }
}

// Create a new shopping list
const createNewShoppingList = () => {
  currentList.value = {
    list_name: '',
    products: [],
  }
  editingList.value = true
  isEditing.value = false
}

// Add a product
const addProduct = () => {
  currentList.value.products.push({
    productname: '',
    quantity: 1,
    unit_price: 0,
  })
}

// Remove a product
const removeProduct = (index) => {
  currentList.value.products.splice(index, 1)
}

// Save shopping list
const saveShoppingList = async () => {
  try {
    let response;
    if (isEditing.value) {
      response = await shoppingListResource.save({ data: { ...currentList.value, name: currentList.value.name } })
    } else {
      response = await shoppingListResource.insert({ data: currentList.value })
    }
    if (response.message) {
      editingList.value = false
      fetchShoppingLists()
    }
  } catch (error) {
    console.error('Error saving shopping list:', error)
  }
}

// Cancel editing
const cancelEditing = () => {
  editingList.value = false
}

fetchShoppingLists()
</script>
