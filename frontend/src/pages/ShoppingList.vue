<template>
  <div class="container mx-auto p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-3xl font-semibold">Shopping Lists</h2>
      <button @click="createNewShoppingList" class="bg-blue-500 text-white px-4 py-2 rounded">Add New List</button>
    </div>

    <ul class="divide-y divide-gray-200">
      <!-- Loop through shopping lists and display names -->
      <li v-for="(list, index) in shoppingLists.data || []" :key="list.name" class="flex justify-between items-center py-4">
        <span class="text-xl">{{ list.list_name }}</span>
        <div class="space-x-2">
          <button @click="editShoppingList(list.name)" class="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
          <button @click="removeShoppingList(list.name)" class="bg-red-500 text-white px-3 py-1 rounded">Remove</button>
        </div>
      </li>
    </ul>

    <p v-if="(shoppingLists.data || []).length === 0" class="text-center text-gray-500">No shopping lists found.</p>

    <button @click="goBack" class="bg-gray-500 text-white px-4 py-2 rounded mt-4">Back</button>

    <!-- Add/Edit Shopping List Modal -->
    <div v-if="editingList" class="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
      <div class="bg-white rounded-lg shadow-lg p-6 space-y-4 w-full max-w-md">
        <h3 class="text-2xl font-semibold">{{ isEditing ? 'Edit Shopping List' : 'New Shopping List' }}</h3>
        <input v-model="currentList.list_name" :disabled="isEditing" placeholder="List Name" class="w-full p-2 border border-gray-300 rounded mb-4" />
        <div class="flex justify-end space-x-2">
          <button @click="saveShoppingList" class="bg-green-500 text-white px-4 py-2 rounded">Save</button>
          <button @click="cancelEditing" class="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { createListResource } from 'frappe-ui';

const router = useRouter();
const shoppingLists = createListResource({
  doctype: 'Shopping List',
  fields: ['name', 'list_name'],
  orderBy: 'creation desc',
  start: 0,
  pageLength: 5,
});

const currentList = ref({ list_name: '' });
const editingList = ref(false);
const isEditing = ref(false);
const notification = ref('');

const fetchShoppingLists = async () => {
  try {
    await shoppingLists.fetch();
  } catch (error) {
    console.error('Error fetching shopping lists:', error);
  }
};

const createNewShoppingList = () => {
  currentList.value = { list_name: '' };
  isEditing.value = false;
  editingList.value = true;
};

const editShoppingList = (name) => {
  const list = shoppingLists.data?.find(list => list.name === name);
  if (list) {
    currentList.value = { ...list };
    isEditing.value = true;
    editingList.value = true;
  }
};

const saveShoppingList = async () => {
  try {
    if (isEditing.value) {
      await shoppingLists.setValue.submit({
        name: currentList.value.name,
        list_name: currentList.value.list_name,
      });
    } else {
      currentList.value.name = `shopping_list_${Date.now()}`;
      await shoppingLists.insert.submit(currentList.value);
    }
    editingList.value = false;
    fetchShoppingLists();
    notification.value = 'Shopping list saved successfully!';
    setTimeout(() => {
      notification.value = '';
    }, 3000);
  } catch (error) {
    console.error('Error saving shopping list:', error);
  }
};

const removeShoppingList = async (name) => {
  try {
    await shoppingLists.delete.submit(name);
    fetchShoppingLists();
    notification.value = 'Shopping list removed successfully!';
    setTimeout(() => {
      notification.value = '';
    }, 3000);
  } catch (error) {
    console.error('Error removing shopping list:', error);
  }
};

const cancelEditing = () => {
  editingList.value = false;
};

const goBack = () => {
  router.push({ name: 'Home' });
};

onMounted(fetchShoppingLists);
</script>
