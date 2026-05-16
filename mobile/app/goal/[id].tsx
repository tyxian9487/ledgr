import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, Check } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/LanguageContext';
import { CategoryIconRaw } from '../../components/home/CategoryIcon';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { budget, transactions, formatCurrency, addTransaction, removeCustomGoal } = useApp();
  const { t } = useTranslation();

  const goal = budget.customGoals?.find(g => g.id === id);

  if (!goal) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center" edges={['top']}>
        <Text className="dark:text-white">Goal not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-green-600">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const pct = goal.targetAmount > 0 ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100) : 0;
  const remaining = goal.targetAmount - goal.savedAmount;

  // Linked transactions
  const linked = transactions
    .filter(t => t.linkedGoalId === goal.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function handleDeposit() {
    Alert.prompt(
      'Add Deposit',
      'Enter amount to deposit:',
      (amountStr) => {
        const amount = parseFloat(amountStr ?? '');
        if (isNaN(amount) || amount <= 0) return;
        addTransaction({
          type: 'expense',
          amount,
          category: 'savings',
          description: `${goal.name} deposit`,
          date: new Date().toISOString(),
          isAutoDebit: false,
          linkedGoalId: goal.id,
        });
      },
      'plain-text',
      '',
      'decimal-pad'
    );
  }

  function handleDelete() {
    Alert.alert(
      'Delete Goal',
      `Delete "${goal.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { removeCustomGoal(goal.id); router.back(); } },
      ]
    );
  }

  const isComplete = pct >= 100;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
        >
          <ArrowLeft size={18} color="#6b7280" />
        </TouchableOpacity>
        <Text className="text-base font-bold dark:text-white" numberOfLines={1}>{goal.name}</Text>
        <TouchableOpacity onPress={handleDelete} className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-900/20 items-center justify-center">
          <Trash2 size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Progress card */}
        <View className="mx-5 mb-5 bg-white dark:bg-gray-900 rounded-3xl p-6 items-center">
          <View className="w-20 h-20 rounded-3xl items-center justify-center mb-4" style={{ backgroundColor: goal.color + '20' }}>
            {isComplete
              ? <Check size={40} color={goal.color} />
              : <CategoryIconRaw icon={goal.icon} color={goal.color} size={36} />}
          </View>

          {isComplete && (
            <View className="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full mb-3">
              <Text className="text-xs font-bold text-green-700 dark:text-green-400">Goal Complete! 🎉</Text>
            </View>
          )}

          <Text className="text-3xl font-bold dark:text-white mb-1">{formatCurrency(goal.savedAmount)}</Text>
          <Text className="text-sm text-gray-400">of {formatCurrency(goal.targetAmount)}</Text>

          {/* Progress bar */}
          <View className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full mt-4 overflow-hidden">
            <View
              className="h-3 rounded-full"
              style={{ width: `${pct}%`, backgroundColor: goal.color }}
            />
          </View>
          <View className="flex-row justify-between w-full mt-2">
            <Text className="text-xs text-gray-400">{pct.toFixed(0)}% complete</Text>
            {!isComplete && <Text className="text-xs text-gray-400">{formatCurrency(remaining)} to go</Text>}
          </View>
        </View>

        {/* Add deposit button */}
        {!isComplete && (
          <TouchableOpacity
            onPress={handleDeposit}
            className="mx-5 mb-5 flex-row items-center justify-center gap-2 bg-green-600 rounded-2xl py-4"
          >
            <Plus size={18} color="white" />
            <Text className="text-white font-bold">Add Deposit</Text>
          </TouchableOpacity>
        )}

        {/* Transaction history */}
        <View className="mx-5 mb-8 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 pt-4 pb-2">Deposits</Text>
          {linked.length === 0 ? (
            <View className="px-4 pb-4">
              <Text className="text-sm text-gray-400">No deposits yet. Add your first deposit above.</Text>
            </View>
          ) : (
            linked.map((tx, i) => (
              <View
                key={tx.id}
                className={`flex-row items-center px-4 py-3 ${i < linked.length - 1 ? 'border-b border-gray-50 dark:border-gray-800' : ''}`}
              >
                <View className="flex-1">
                  <Text className="text-sm font-medium dark:text-white">{tx.description}</Text>
                  <Text className="text-xs text-gray-400 mt-0.5">{new Date(tx.date).toLocaleDateString()}</Text>
                </View>
                <Text className="text-sm font-bold text-green-600">+{formatCurrency(tx.amount)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
