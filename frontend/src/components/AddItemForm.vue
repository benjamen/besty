<template>
  <div class="bg-white rounded-lg shadow p-6 mb-6">
    <h2 class="text-xl font-semibold mb-4">Add New Item</h2>
    <form @submit.prevent="submitForm" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Item Name</label>
          <input 
            v-model="form.name"
            type="text"
            class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700">Category</label>
          <select 
            v-model="form.category"
            class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Quantity</label>
          <div class="flex gap-2">
            <input 
              v-model.number="form.quantity"
              type="number"
              min="0"
              step="0.1"
              class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
            <select 
              v-model="form.unit"
              class="mt-1 w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option v-for="unit in units" :key="unit" :value="unit">
                {{ unit }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Estimated Price</label>
          <input 
            v-model.number="form.price"
            type="number"
            min="0"
            step="0.01"
            class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Priority</label>
          <select 
            v-model="form.priority"
            class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Due Date</label>
          <input 
            v-model="form.due_date"
            type="date"
            class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Notes</label>
        <textarea 
          v-model="form.notes"
          class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows="2"
        ></textarea>
      </div>

      <div class="flex justify-end gap-2">
        <Button
          variant="secondary"
          @click="resetForm"
        >
          Reset
        </Button>
        <Button
          type="submit"
          :loading="isLoading"
        >
          Add Item
        </Button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { Button } from 'frappe-ui';

const emit = defineEmits(['item-added']);

const categories = [
  'Fruits & Vegetables',
  'Dairy & Eggs',
  'Meat & Seafood',
  'Pantry Items',
  'Beverages',
  'Snacks',
  'Household',
  'Other'
];

const units = ['pcs', 'kg', 'g', 'L', 'ml', 'pack'];

const isLoading = ref(false);
const form = reactive({
  name: '',
  category: 'Pantry Items',
  quantity: 1,
  unit: 'pcs',
  price: null,
  priority: 'Medium',
  notes: '',
  due_date: ''
});

const submitForm = async () => {
  isLoading.value = true;
  try {
    const response = await fetch('/api/method/grocery_app.api.add_item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    });
    if (response.ok) {
      emit('item-added');
      resetForm();
    }
  } catch (error) {
    console.error('Error adding item:', error);
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  Object.assign(form, {
    name: '',
    category: 'Pantry Items',
    quantity: 1,
    unit: 'pcs',
    price: null,
    priority: 'Medium',
    notes: '',
    due_date: ''
  });
};
</script>

<style scoped>
/* Add any styles you want here */
</style>