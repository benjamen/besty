// components/ShoppingList.vue
<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <select
        v-model="currentListName"
        class="p-2 border border-gray-300 rounded-lg"
        @change="handleListChange"
      >
        <option value="">Select a List</option>
        <option v-for="list in shoppingLists.data" :key="list.name" :value="list.name">
          {{ list.list_name }}
        </option>
      </select>
      <button
        @click="createNewList"
        class="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
      >
        New List
      </button>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div v-show="show && items.length" class="bg-white p-4 rounded-lg shadow-md">
        <h3 class="text-xl font-bold text-gray-900">Shopping List</h3>
        
        <div v-if="groupedItems" class="space-y-6 mt-4">
          <div 
            v-for="(group, source) in groupedItems" 
            :key="source" 
            class="border-b border-gray-200 pb-4 last:border-0"
          >
            <div class="flex justify-between items-center mb-3 bg-gray-100 p-3 rounded-lg">
              <h4 class="text-lg font-semibold text-gray-800">{{ source }}</h4>
              <span class="text-lg font-bold text-gray-700">
                Subtotal: ${{ getGroupSubtotal(group).toFixed(2) }}
              </span>
            </div>
            
            <div class="space-y-2">
              <div
                v-for="item in group"
                :key="item.productname"
                class="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg shadow-sm"
              >
                <div class="flex-1 mb-2 sm:mb-0">
                  <strong class="text-lg block sm:inline">{{ item.productname }}</strong>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    <p class="text-sm text-gray-600">Price: ${{ item.current_price }}</p>
                    <p class="text-sm text-gray-600">Quantity: {{ item.quantity }}</p>
                    <p class="text-sm text-gray-600">Total: ${{ (item.current_price * item.quantity).toFixed(2) }}</p>
                  </div>
                </div>
                <button
                  @click="$emit('removeItem', item)"
                  class="w-full sm:w-auto py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-gray-200">
          <div class="text-xl font-bold text-right">
            Grand Total: ${{ totalPrice }}
          </div>
        </div>

        <div class="mt-4 flex justify-between">
          <button 
            @click="saveCurrentList"
            class="py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
          >
            Save List
          </button>
          <button 
            @click="$emit('export')"
            class="py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
          >
            Export to XLS
          </button>
        </div>
      </div>
    </Transition>

    <!-- New List Modal -->
    <div v-if="showNewListModal" class="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
      <div class="bg-white rounded-lg shadow-lg p-6 space-y-4 w-full max-w-md">
        <h3 class="text-2xl font-semibold">New Shopping List</h3>
        <input 
          v-model="newListName" 
          placeholder="List Name" 
          class="w-full p-2 border border-gray-300 rounded"
        />
        <div class="flex justify-end space-x-2">
          <button 
            @click="createList" 
            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Create
          </button>
          <button 
            @click="showNewListModal = false" 
            class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { createListResource } from 'frappe-ui'

const props = defineProps({
  show: Boolean,
  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['removeItem', 'export'])

// List management
const showNewListModal = ref(false)
const newListName = ref('')
const currentListName = ref('')

// Frappe resources
const shoppingLists = createListResource({
  doctype: 'Shopping List',
  fields: ['name', 'list_name', 'items'],
  orderBy: 'creation desc',
})

// Computed properties
const groupedItems = computed(() => {
  return props.items.reduce((groups, item) => {
    const source = item.source_site
    if (!groups[source]) {
      groups[source] = []
    }
    groups[source].push(item)
    return groups
  }, {})
})

const totalPrice = computed(() => {
  return props.items.reduce((total, item) => {
    return total + item.current_price * item.quantity
  }, 0).toFixed(2)
})

// Methods
const getGroupSubtotal = (group) => {
  return group.reduce((total, item) => {
    return total + (item.current_price * item.quantity)
  }, 0)
}

const createNewList = () => {
  showNewListModal.value = true
  newListName.value = ''
}

const createList = async () => {
  try {
    const response = await shoppingLists.insert.submit({
      list_name: newListName.value,
      items: [] // Initialize empty items array
    })
    
    currentListName.value = response.name
    showNewListModal.value = false
    await shoppingLists.fetch()
  } catch (error) {
    console.error('Error creating shopping list:', error)
  }
}

const saveCurrentList = async () => {
  if (!currentListName.value) {
    alert('Please select or create a list first')
    return
  }

  try {
    // Format items according to Shopping Item doctype structure
    const formattedItems = props.items.map(item => ({
      product: item.name, // Link field to Product Item
      price: item.current_price, // Auto-fetched from product
      quantity: item.quantity
    }))

    // Update the shopping list with new items
    await shoppingLists.setValue.submit({
      name: currentListName.value,
      items: formattedItems
    })

    alert('Shopping list saved successfully!')
  } catch (error) {
    console.error('Error saving shopping list:', error)
    alert('Error saving shopping list')
  }
}

const handleListChange = async () => {
  if (currentListName.value) {
    try {
      const list = await shoppingLists.get(currentListName.value)
      if (list && list.items) {
        // Transform child table items back to the format expected by the component
        const transformedItems = await Promise.all(list.items.map(async (item) => {
          // Fetch full product details since we need additional fields
          const product = await frappe.db.get_doc('Product Item', item.product)
          return {
            name: item.product,
            productname: product.productname,
            current_price: item.price,
            quantity: item.quantity,
            source_site: product.source_site
          }
        }))
        emit('update:items', transformedItems)
      }
    } catch (error) {
      console.error('Error loading shopping list:', error)
    }
  }
}

// Initial setup
onMounted(async () => {
  await shoppingLists.fetch()
})
</script>