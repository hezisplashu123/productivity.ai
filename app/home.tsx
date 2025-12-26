import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react-native';
import { useApp } from '../src/context/AppContext';
import { lightColors as colors } from '../src/constants/colors';
import { SunBackground } from '../src/components/SunBackground';

export default function HomeScreen() {
  const { goals, currentGoal, setCurrentGoal } = useApp();
  const router = useRouter();
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(
    currentGoal?.id || null
  );

  const handleGoalPress = useCallback((goalId: string) => {
    if (expandedGoalId === goalId) {
      setExpandedGoalId(null);
    } else {
      setExpandedGoalId(goalId);
      const goal = goals.find((g) => g.id === goalId);
      if (goal) {
        setCurrentGoal(goal);
      }
    }
  }, [expandedGoalId, goals, setCurrentGoal]);

  const handleViewActionPlan = useCallback((goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      setCurrentGoal(goal);
      router.push('/action-plan');
    }
  }, [goals, setCurrentGoal, router]);


  if (goals.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.backgroundLight }]}>
        <StatusBar style="dark" />
        <View style={styles.emptyContainer}>
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400 }}
          >
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No goals yet
            </Text>
          </MotiView>
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
          >
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/goal-input')}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: colors.background }]}>
                Create Your First Goal
              </Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundLight }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            My Goals
          </Text>
        </MotiView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
      >
        {goals.map((goal, index) => {
          const isExpanded = expandedGoalId === goal.id;
          return (
            <MotiView
              key={goal.id}
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 200, delay: Math.min(index * 50, 300) }}
            >
              <TouchableOpacity
                style={[
                  styles.goalCard,
                  {
                    backgroundColor: colors.backgroundCard,
                    borderColor: colors.border,
                    shadowColor: colors.primary,
                  },
                  isExpanded && {
                    borderColor: colors.primary,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => handleGoalPress(goal.id)}
                activeOpacity={0.8}
              >
                <View style={styles.goalHeader}>
                  <View style={styles.goalHeaderContent}>
                    <Text style={[styles.goalTitle, { color: colors.text }]}>
                      {goal.title}
                    </Text>
                    <Text
                      style={[styles.goalStatus, { color: colors.textSecondary }]}
                    >
                      {goal.status === 'active' ? 'In Progress' : 'Completed'}
                    </Text>
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={24} color={colors.primary} />
                  ) : (
                    <ChevronDown size={24} color={colors.textSecondary} />
                  )}
                </View>

                {isExpanded && (
                  <MotiView
                    from={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ type: 'timing', duration: 300 }}
                  >
                    <View style={styles.expandedContent}>
                      <Text
                        style={[
                          styles.expandedDescription,
                          { color: colors.textSecondary },
                        ]}
                      >
                        View and manage your action plan for this goal
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          { backgroundColor: colors.primary },
                        ]}
                        onPress={() => handleViewActionPlan(goal.id)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.actionButtonText,
                            { color: colors.background },
                          ]}
                        >
                          View Action Plan
                        </Text>
                        <ArrowRight size={20} color={colors.background} />
                      </TouchableOpacity>
                    </View>
                  </MotiView>
                )}
              </TouchableOpacity>
            </MotiView>
          );
        })}

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.glow }]}
          onPress={() => router.push('/goal-input')}
          activeOpacity={0.8}
        >
          <Text style={[styles.addButtonText, { color: colors.primary }]}>
            + Add New Goal
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  goalCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalHeaderContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.2)',
  },
  expandedDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});

