<template>
  <div>
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

    <!-- List Selection Modal -->
    <div v-if="showListSelectionModal" class="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center" @click.stop>
      <div class="bg-white rounded-lg shadow-lg p-6 space-y-4 w-full max-w-md">
        <h3 class="text-2xl font-semibold">Select a Shopping List</h3>
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
        <div class="flex justify-end">
          <button 
            @click="confirmSelection" 
            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            :disabled="!currentListName"
          >
            Confirm
          </button>
        </div>
      </div>
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
        <h3 class="text-xl font-bold text-gray-900">{{ currentListName }}</h3>
        
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
                  @click="removeItem(item)"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { createListResource, createResource } from 'frappe-ui';

const props = defineProps({
  show: Boolean,
  items: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['remove-item', 'export', 'update:items']);

// Modal states and input values
const showNewListModal = ref(false);
const showListSelectionModal = ref(false);
const newListName = ref('');
const currentListName = ref('');

// Resource for shopping lists
const shoppingLists = createListResource({
  doctype: 'Shopping List',
  fields: ['name', 'list_name'],
  orderBy: 'creation desc',
  start: 0,
  pageLength: 5,
});

// Group items by source
const groupedItems = computed(() => {
  return props.items.reduce((groups, item) => {
    const source = item.source_site;
    if (!groups[source]) {
      groups[source] = [];
    }
    groups[source].push(item);
    return groups;
  }, {});
});

// Calculate total price
const totalPrice = computed(() => {
  return props.items.reduce((total, item) => {
    return total + item.current_price * item.quantity;
  }, 0).toFixed(2);
});

// Get subtotal for a group
const getGroupSubtotal = (group) => {
  return group.reduce((total, item) => {
    return total + (item.current_price * item.quantity);
  }, 0);
};

// Watch for changes in items prop
watch(() => props.items, async (newItems) => {
  await saveCurrentList();
}, { deep: true }); // Use deep watch to track changes in nested objects

// Save the current list to the database
const saveCurrentList = async () => {
  if (!currentListName.value) {
    alert('Please select or create a list first');
    return;
  }

  try {
    const formattedItems = props.items.map(item => ({
      product: item.productname,
      price: item.current_price,
      quantity: item.quantity,
      doctype: 'Shopping Item'
    }));

    const shoppingListResource = createResource({
      url: '/api/method/frappe.client.set_value',
      params: {
        doctype: 'Shopping List',
        name: currentListName.value,
        fieldname: 'shopping_items',
        value: formattedItems
      }
    });

    const response = await shoppingListResource.fetch();
    
    if (response && response.name) {
      alert('Shopping list saved successfully!');
    } else {
      alert('Failed to save shopping list. Please check the console for details.');
    }
  } catch (error) {
    console.error('Error saving shopping list:', error);
    alert('Failed to save shopping list: ' + error.message);
  }
};

// Remove an item from the list
const removeItem = async (item) => {
  console.log('Item to remove:', item);


  // Emit the event to the parent component to remove the item
  emit('remove-item', item); // Emit the item to be removed
};

// Confirm the selection of a shopping list
const confirmSelection = () => {
  if (currentListName.value) {
    showListSelectionModal.value = false; // Close the modal only if a list is selected
  } else {
    alert('Please select a list or create a new one.'); // Alert if no selection
  }
};

// Handle the change of the selected list
const handleListChange = async () => {
  console.log('Current List Name:', currentListName.value); // Log the selected list name

  if (currentListName.value) {
    try {
      // Fetch the selected shopping list from the backend
      const shoppingListResource = createResource({
        url: '/api/method/frappe.client.get',
        params: {
          doctype: 'Shopping List',
          name: currentListName.value
        }
      });
      
      await shoppingListResource.fetch();

      // Log the fetched data
      console.log('Fetched Shopping List Data:', shoppingListResource.data);

      // Check if we have shopping items
      if (shoppingListResource.data && shoppingListResource.data.shopping_items) {
        // Transform the fetched items
        const transformedItems = await Promise.all(shoppingListResource.data.shopping_items.map(async (item) => {
          const productResource = createResource({
            url: '/api/method/frappe.client.get',
            params: {
              doctype: 'Product Item',
              name: item.name
            }
          });
          
          await productResource.fetch();
          return {
            name: item.product,
            productname: productResource.data.productname,
            current_price: item.price,
            quantity: item.quantity,
            source_site: productResource.data.source_site // This may be needed for grouping
          };
        }));

        // Emit the transformed items to update the UI
        emit('update:items', transformedItems);
      } else {
        console.error('No shopping_items found in the fetched shopping list.');
      }
    } catch (error) {
      console.error('Error loading shopping list:', error);
    }
  }
}

// Fetch the shopping lists on component mount
onMounted(async () => {
  await shoppingLists.fetch();
  showListSelectionModal.value = true; // Show the modal on mount
});
</script>