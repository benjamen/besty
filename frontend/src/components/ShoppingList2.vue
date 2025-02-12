<template>
  <div>
    <!-- New List Modal and List Selection Modal remain unchanged -->
    <div v-if="showNewListModal" class="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <!-- ... existing modal code ... -->
    </div>

    <div v-if="showListSelectionModal" class="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-40" @click.stop>
      <!-- ... existing modal code ... -->
    </div>

    <div v-show="show && items.length" class="bg-white p-4 rounded-lg shadow-md">
      <h3 class="text-xl font-bold text-gray-900">{{ displayListName || 'Untitled List' }}</h3>
      
      <div v-if="groupedItems" class="space-y-6 mt-4">
        <div v-for="(group, source) in groupedItems" :key="source" class="border-b border-gray-200 pb-4 last:border-0">
          <div class="flex justify-between items-center mb-3 bg-gray-100 p-3 rounded-lg">
            <h4 class="text-lg font-semibold text-gray-800">{{ source }}</h4>
            <span class="text-lg font-bold text-gray-700">
              Subtotal: ${{ getGroupSubtotal(group).toFixed(2) }}
            </span>
          </div>
          
          <div class="space-y-2">
            <div v-for="item in group" 
                 :key="item.productname" 
                 class="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg shadow-sm"
                 :class="{ 'opacity-60': item.bought }">
              <div class="absolute top-2 right-2">
                <button
                  @click="removeItem(item)"
                  class="text-gray-500 hover:text-red-500 transition-colors duration-200"
                  title="Remove item"
                >
                  <span class="text-xl">×</span>
                </button>
              </div>

              <img 
                :src="item.image_url || 'https://placehold.co/100x100/FFFFFF/FFFFFF.png'" 
                alt="Product Image" 
                class="w-16 h-16 object-cover rounded-lg"
                @error="handleImageError"
              />

              <div class="flex-1 mb-2 sm:mb-0">
                <strong class="text-lg block sm:inline" :class="{ 'line-through': item.bought }">
                  {{ item.productname }}
                </strong>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  <p class="text-sm text-gray-600">Price: ${{ item.current_price }}</p>
                  <p class="text-sm text-gray-600">Quantity: {{ item.quantity }}</p>
                  <p class="text-sm text-gray-600">Total: ${{ (item.current_price * item.quantity).toFixed(2) }}</p>
                </div>
              </div>
              <button
                @click="toggleItemBought(item)"
                class="w-full sm:w-auto py-2 px-4 rounded-lg transition-colors duration-200"
                :class="item.bought ? 
                  'bg-gray-500 hover:bg-gray-600 text-white' : 
                  'bg-green-500 hover:bg-green-600 text-white'"
              >
                {{ item.bought ? 'Mark as Unbought' : 'Mark as Bought' }}
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
        <button @click="saveCurrentList" class="py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200">
          Save List
        </button>
        <button @click="$emit('export')" class="py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200">
          Export to XLS
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { createListResource, createResource } from 'frappe-ui';

// ... existing props, emits, and refs ...

// Add toggleItemBought function
const toggleItemBought = (item) => {
  item.bought = !item.bought;
};

// Modify the saveCurrentList function to include bought status
const saveCurrentList = async () => {
  if (!currentListId.value) {
    return;
  }

  try {
    const formattedItems = props.items.map((item) => ({
      product: item.name,
      productname: item.productname,
      price: item.current_price,
      quantity: item.quantity,
      bought: item.bought || false,
      doctype: 'Shopping Item',
    }));

    const shoppingListResource = createResource({
      url: '/api/method/frappe.client.set_value',
      params: {
        doctype: 'Shopping List',
        name: currentListId.value,
        fieldname: 'shopping_items',
        value: formattedItems,
      },
    });

    const response = await shoppingListResource.fetch();

    if (!response || !response.name) {
      console.error('Error saving shopping list:', response);
      alert('Failed to save shopping list. Please check the console for details.');
    }
  } catch (error) {
    console.error('Error saving shopping list:', error);
    alert('Failed to save shopping list: ' + error.message);
  }
};

// Modify the handleListChange function to include bought status
const handleListChange = async () => {
  if (currentListId.value) {
    try {
      const shoppingListResource = createResource({
        url: '/api/method/frappe.client.get',
        params: {
          doctype: 'Shopping List',
          name: currentListId.value,
        },
      });

      await shoppingListResource.fetch();

      if (shoppingListResource.data && shoppingListResource.data.list_name) {
        displayListName.value = shoppingListResource.data.list_name;
      }

      if (shoppingListResource.data && shoppingListResource.data.shopping_items) {
        const productDetails = await Promise.all(
          shoppingListResource.data.shopping_items.map(async (item) => {
            const productResource = createResource({
              url: '/api/method/frappe.client.get',
              params: {
                doctype: 'Product Item',
                name: item.product,
              },
            });

            try {
              await productResource.fetch();
              return productResource.data;
            } catch (error) {
              console.error(`Error fetching product details for ${item.product}:`, error);
              return null;
            }
          })
        );

        const transformedItems = shoppingListResource.data.shopping_items.map((item, index) => {
          const productInfo = productDetails[index];
          return {
            name: item.product,
            productname: productInfo ? productInfo.productname : item.productname,
            current_price: item.price,
            quantity: item.quantity,
            source_site: productInfo ? productInfo.source_site : item.source_site,
            image_url: productInfo ? productInfo.image_url : null,
            bought: item.bought || false,
          };
        });

        emit('update:items', transformedItems);
      }
    } catch (error) {
      console.error('Error loading shopping list:', error);
    }
  }
};

// ... rest of the existing code ...
</script>
