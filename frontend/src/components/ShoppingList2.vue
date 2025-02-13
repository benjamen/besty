<template>
  <div>
    <!-- New List Modal -->
    <div v-if="showNewListModal" class="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
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
    <div v-if="showListSelectionModal" class="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-40" @click.stop>
      <div class="bg-white rounded-lg shadow-lg p-6 space-y-4 w-full max-w-md">
        <h3 class="text-2xl font-semibold">Select a Shopping List</h3>
        <div class="flex justify-between items-center mb-4">
          <select
            v-model="currentListId"
            class="p-2 border border-gray-300 rounded-lg"
            @change="handleListChange"
          >
            <option value="">Select a List</option>
            <option v-for="list in shoppingLists.data" :key="list.name" :value="list.name">
              {{ list.list_name }}
            </option>
          </select>
          <button
            @click="showNewListModal = true"
            class="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            New List
          </button>
        </div>
        <div class="flex justify-end">
          <button 
            @click="confirmSelection" 
            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            :disabled="!currentListId"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { createListResource } from 'frappe-ui';

const showNewListModal = ref(false);
const showListSelectionModal = ref(false);
const newListName = ref('');
const currentListId = ref('');

const shoppingLists = createListResource({
  doctype: 'Shopping List',
  fields: ['name', 'list_name'],
  orderBy: 'creation desc',
  start: 0,
  pageLength: 5,
});

const createList = async () => {
  if (!newListName.value) {
    alert('Please enter a name for the new list.');
    return;
  }
  try {
    const existingLists = await shoppingLists.fetch({
      params: { doctype: 'Shopping List', filters: { list_name: newListName.value } },
    });
    if (existingLists && existingLists.length > 0) {
      alert('A shopping list with this name already exists. Please choose a different name.');
      return;
    }
    const response = await shoppingLists.insert.submit({ list_name: newListName.value, items: [] });
    if (response && response.name) {
      currentListId.value = response.name;
      showNewListModal.value = false;
      await shoppingLists.fetch();
    } else {
      console.error('Error creating shopping list, no name returned.');
      alert('Failed to create shopping list.');
    }
  } catch (error) {
    console.error('Error creating shopping list:', error);
    alert('Failed to create shopping list: ' + error.message);
  }
};

const confirmSelection = () => {
  if (currentListId.value) {
    showListSelectionModal.value = false;
  } else {
    alert('Please select a list or create a new one.');
  }
};
</script>
