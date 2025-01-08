<template>
  <div class="min-h-screen bg-gray-100">
    <div class="max-w-6xl mx-auto p-4">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">My Smart Grocery List</h1>
        <p class="text-gray-600">Organize your shopping efficiently</p>
      </div>

      <AddItemForm @item-added="addItem" />
      
      <div class="mb-4 bg-white rounded-lg shadow p-4">
        <div class="flex justify-between items-center">
          <div class="text-gray-600">
            Total Items: {{ items.length }} |
            Completed: {{ completedCount }} |
            Pending: {{ pendingCount }}
          </div>
          <div class="text-lg font-semibold">
            Total Estimated: ${{ totalEstimated.toFixed(2) }}
          </div>
        </div>
      </div>

      <GroceryList 
        :items="items"
        @update-item="updateItem"
        @delete-item="deleteItem"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import AddItemForm from '../components/AddItemForm.vue';
import GroceryList from '../components/GroceryList.vue';

const items = ref([]);

const completedCount = computed(() => items.value.filter(item => item.completed).length);
const pendingCount = computed(() => items.value.filter(item => !item.completed).length);
const totalEstimated = computed(() => {
  return items.value.reduce((total, item) => total + (item.price || 0), 0);
});

const fetchItems = async () => {
  try {
    const response = await fetch('/api/method/besty.api.grocery.get_items');
    const data = await response.json();
    items.value = data.message || []; // Ensure it defaults to an empty array if undefined
  } catch (error) {
    console.error('Error fetching items:', error);
  }
};

const addItem = (item) => {
  items.value.push(item);
  // Optionally, you can call an API to save the new item
};

const updateItem = async (item) => {
  try {
    await fetch('/api/method/besty.api.grocery.update_item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    await fetchItems();
  } catch (error) {
    console.error('Error updating item:', error);
  }
};

const deleteItem = async (item) => {
  try {
    await fetch('/api/method/besty.api.grocery.delete_item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: item.name,
      }),
    });
    await fetchItems();
  } catch (error) {
    console.error('Error deleting item:', error);
  }
};

onMounted(() => {
  fetchItems();
});
</script>