<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex flex-wrap gap-4">
        <select 
          v-model="filters.category"
          class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>

        <select 
          v-model="filters.priority"
          class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <select 
          v-model="filters.completed"
          class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option :value="false">Pending</option>
          <option :value="true">Completed</option>
        </select>
      </div>
    </div>

    <!-- Categories -->
    <div v-for="category in groupedItems" :key="category.name" class="bg-white rounded-lg shadow">
      <div class="p-4 border-b bg-gray-50">
        <h3 class="text-lg font-semibold text-gray-800">
          {{ category.name }}
          <span class="text-sm text-gray-500">({{ category.items.length }} items)</span>
        </h3>
      </div>
      
      <div class="divide-y">
        <div 
          v-for="item in category.items" 
          :key="item.name"
          class="p-4 hover:bg-gray-50"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <Checkbox
                v-model="item.completed"
                @change="updateItem(item)"
              />
              <div :class="{'text-gray-500': item.completed}">
                <div class="flex items-center gap-2">
                  <span :class="{'line-through': item.completed}">{{ item.name || 'Unnamed Item' }}</span>
                  <Badge
                    :variant="getPriorityColor(item.priority)"
                    class="text-xs"
                  >
                    {{ item.priority || 'No Priority' }}
                  </Badge>
                </div>
                <div class="text-sm text-gray-500">
                  {{ item.quantity || 0 }} {{ item.unit || 'units' }}
                  <span v-if="item.price">• ${{ item.price.toFixed(2) }}</span>
                </div>
              </div>
            </div>
            
            <div class="flex items-center gap-2">
              <span v-if="item.due_date" class="text-sm text-gray-500">
                Due: {{ formatDate(item.due_date) }}
              </span>
              <Button
                variant="danger"
                @click="deleteItem(item)"
              >
                Delete
              </Button>
            </div>
          </div>
          
          <div v-if="item.notes" class="mt-2 text-sm text-gray-600">
            {{ item.notes }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Button, Checkbox, Badge } from 'frappe-ui';

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
});

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

const filters = ref({
  category: '',
  priority: '',
  completed: ''
});

const filteredItems = computed(() => {
  return props.items.filter(item => {
    if (!item) return false; // Check for undefined items
    if (filters.value.category && item.category !== filters.value.category) return false;
    if (filters.value.priority && item.priority !== filters.value.priority) return false;
    if (filters.value.completed !== '' && item.completed !== filters.value.completed) return false;
    return true;
  });
});

const groupedItems = computed(() => {
  const groups = categories.map(category => ({
    name: category,
    items: filteredItems.value.filter(item => item.category === category)
  }));
  return groups.filter(group => group.items.length > 0);
});

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High': return 'red';
    case 'Medium': return 'yellow';
    case 'Low': return 'green';
    default: return 'gray';
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

const emit = defineEmits(['update-item', 'delete-item']);

const updateItem = (item) => {
  emit('update-item', item);
};

const deleteItem = (item) => {
  emit('delete-item', item);
};
</script>

<style scoped>
/* Add any styles you want here */
</style>