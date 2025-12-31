import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';
import { useProductStore } from '@/store';
import { useTranslatedText } from '@/hooks';
import { Product, StockByDate } from '@/types';
import { isRTL, getFlexDirection, getTextAlign } from '@/utils/rtl';

interface ProductCalendarProps {
  product?: Product;
  onStockUpdate?: (productId: string, stockByDate: StockByDate[]) => void;
  editable?: boolean;
}

type ViewMode = 'week' | 'month';

const STOCK_COLORS = {
  high: '#4CAF50',    // > 10
  medium: '#FF9800',  // 1-10
  low: '#F44336',     // 0
};

export const ProductCalendar: React.FC<ProductCalendarProps> = ({
  product,
  onStockUpdate,
  editable = false,
}) => {
  const { t, i18n } = useTranslation();
  const { getText } = useTranslatedText();
  const { products, updateStock } = useProductStore();
  const rtl = isRTL();

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editQuantity, setEditQuantity] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(product || null);

  // Generate 7-day timeline starting from today
  const weekDates = useMemo(() => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  // Get stock for a specific date
  const getStockForDate = useCallback(
    (date: string): number | null => {
      if (!selectedProduct) return null;
      const stock = selectedProduct.stockByDate.find((s) => s.date === date);
      return stock?.quantity ?? null;
    },
    [selectedProduct]
  );

  // Get color based on stock level
  const getStockColor = (quantity: number | null): string => {
    if (quantity === null) return '#E0E0E0';
    if (quantity === 0) return STOCK_COLORS.low;
    if (quantity <= 10) return STOCK_COLORS.medium;
    return STOCK_COLORS.high;
  };

  // Format date for display
  const formatDate = (dateStr: string): { day: string; weekday: string } => {
    const date = new Date(dateStr);
    const day = date.getDate().toString();
    const weekday = date.toLocaleDateString(i18n.language, { weekday: 'short' });
    return { day, weekday };
  };

  // Handle date selection
  const handleDatePress = (date: string) => {
    if (!editable || !selectedProduct) return;
    setSelectedDate(date);
    const currentStock = getStockForDate(date);
    setEditQuantity(currentStock?.toString() || '0');
    setEditModalVisible(true);
  };

  // Handle stock update
  const handleStockSave = async () => {
    if (!selectedProduct || !selectedDate) return;

    const quantity = parseInt(editQuantity, 10);
    if (isNaN(quantity) || quantity < 0) {
      Alert.alert(t('common.error'), t('validation.minValue', { min: 0 }));
      return;
    }

    const updatedStock = [...selectedProduct.stockByDate];
    const existingIndex = updatedStock.findIndex((s) => s.date === selectedDate);

    if (existingIndex >= 0) {
      updatedStock[existingIndex] = { date: selectedDate, quantity };
    } else {
      updatedStock.push({ date: selectedDate, quantity });
    }

    try {
      await updateStock(selectedProduct.id, updatedStock);
      onStockUpdate?.(selectedProduct.id, updatedStock);
      setEditModalVisible(false);
      Alert.alert(t('common.ok'), t('calendar.stockUpdated'));
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.serverError'));
    }
  };

  // Generate marked dates for calendar
  const markedDates = useMemo(() => {
    if (!selectedProduct) return {};

    const marks: Record<string, { marked: boolean; dotColor: string; selected?: boolean }> = {};
    
    selectedProduct.stockByDate.forEach((stock) => {
      marks[stock.date] = {
        marked: true,
        dotColor: getStockColor(stock.quantity),
        selected: stock.date === selectedDate,
      };
    });

    return marks;
  }, [selectedProduct, selectedDate]);

  // Render 7-day timeline
  const renderWeekTimeline = () => (
    <View style={styles.timelineContainer}>
      <Text style={[styles.sectionTitle, { textAlign: getTextAlign() }]}>
        {t('calendar.timeline')}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.timelineScroll,
          rtl && styles.timelineScrollRTL,
        ]}
      >
        {weekDates.map((date) => {
          const { day, weekday } = formatDate(date);
          const stock = getStockForDate(date);
          const isToday = date === new Date().toISOString().split('T')[0];

          return (
            <TouchableOpacity
              key={date}
              style={[
                styles.timelineDay,
                isToday && styles.timelineDayToday,
              ]}
              onPress={() => handleDatePress(date)}
              accessibilityRole="button"
              accessibilityLabel={`${weekday} ${day}, ${t('calendar.quantity')}: ${stock ?? t('common.noData')}`}
            >
              <Text style={[styles.timelineWeekday, isToday && styles.timelineTextToday]}>
                {weekday}
              </Text>
              <Text style={[styles.timelineDayNumber, isToday && styles.timelineTextToday]}>
                {day}
              </Text>
              <View
                style={[
                  styles.stockIndicator,
                  { backgroundColor: getStockColor(stock) },
                ]}
              >
                <Text style={styles.stockIndicatorText}>
                  {stock ?? '-'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // Render product selector
  const renderProductSelector = () => {
    if (product) return null; // Single product mode

    return (
      <View style={styles.selectorContainer}>
        <Text style={[styles.sectionTitle, { textAlign: getTextAlign() }]}>
          {t('calendar.selectProduct')}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productChips}
        >
          <TouchableOpacity
            style={[
              styles.productChip,
              !selectedProduct && styles.productChipSelected,
            ]}
            onPress={() => setSelectedProduct(null)}
          >
            <Text
              style={[
                styles.productChipText,
                !selectedProduct && styles.productChipTextSelected,
              ]}
            >
              {t('calendar.allProducts')}
            </Text>
          </TouchableOpacity>
          {products.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.productChip,
                selectedProduct?.id === p.id && styles.productChipSelected,
              ]}
              onPress={() => setSelectedProduct(p)}
            >
              <Text
                style={[
                  styles.productChipText,
                  selectedProduct?.id === p.id && styles.productChipTextSelected,
                ]}
                numberOfLines={1}
              >
                {getText(p.name)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render view mode toggle
  const renderViewToggle = () => (
    <View style={[styles.toggleContainer, { flexDirection: getFlexDirection() }]}>
      <TouchableOpacity
        style={[styles.toggleButton, viewMode === 'week' && styles.toggleButtonActive]}
        onPress={() => setViewMode('week')}
        accessibilityRole="tab"
        accessibilityState={{ selected: viewMode === 'week' }}
      >
        <Text
          style={[
            styles.toggleButtonText,
            viewMode === 'week' && styles.toggleButtonTextActive,
          ]}
        >
          {t('calendar.weekView')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleButton, viewMode === 'month' && styles.toggleButtonActive]}
        onPress={() => setViewMode('month')}
        accessibilityRole="tab"
        accessibilityState={{ selected: viewMode === 'month' }}
      >
        <Text
          style={[
            styles.toggleButtonText,
            viewMode === 'month' && styles.toggleButtonTextActive,
          ]}
        >
          {t('calendar.monthView')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render edit modal
  const renderEditModal = () => (
    <Modal
      visible={editModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setEditModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('calendar.updateStock')}</Text>
          <Text style={styles.modalDate}>
            {selectedDate && new Date(selectedDate).toLocaleDateString(i18n.language)}
          </Text>
          <TextInput
            style={styles.modalInput}
            value={editQuantity}
            onChangeText={setEditQuantity}
            keyboardType="numeric"
            placeholder={t('calendar.quantity')}
            accessibilityLabel={t('calendar.quantity')}
          />
          <View style={[styles.modalButtons, { flexDirection: getFlexDirection() }]}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.modalButtonCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSave]}
              onPress={handleStockSave}
            >
              <Text style={styles.modalButtonSaveText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderProductSelector()}
      {renderViewToggle()}
      
      {viewMode === 'week' ? (
        renderWeekTimeline()
      ) : (
        <View style={styles.calendarContainer}>
          <Calendar
            markedDates={markedDates}
            onDayPress={(day: DateData) => handleDatePress(day.dateString)}
            theme={{
              todayTextColor: '#E91E63',
              selectedDayBackgroundColor: '#E91E63',
              arrowColor: '#E91E63',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
            enableSwipeMonths
          />
        </View>
      )}

      {/* Stock Legend */}
      <View style={styles.legendContainer}>
        <View style={[styles.legendItem, { flexDirection: getFlexDirection() }]}>
          <View style={[styles.legendDot, { backgroundColor: STOCK_COLORS.high }]} />
          <Text style={styles.legendText}>&gt; 10</Text>
        </View>
        <View style={[styles.legendItem, { flexDirection: getFlexDirection() }]}>
          <View style={[styles.legendDot, { backgroundColor: STOCK_COLORS.medium }]} />
          <Text style={styles.legendText}>1-10</Text>
        </View>
        <View style={[styles.legendItem, { flexDirection: getFlexDirection() }]}>
          <View style={[styles.legendDot, { backgroundColor: STOCK_COLORS.low }]} />
          <Text style={styles.legendText}>0</Text>
        </View>
      </View>

      {renderEditModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  selectorContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  productChips: {
    flexDirection: 'row',
    gap: 8,
  },
  productChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  productChipSelected: {
    backgroundColor: '#E91E63',
  },
  productChipText: {
    fontSize: 14,
    color: '#757575',
    maxWidth: 120,
  },
  productChipTextSelected: {
    color: '#FFFFFF',
  },
  toggleContainer: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    marginBottom: 8,
    justifyContent: 'center',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#E91E63',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  timelineContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  timelineScroll: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineScrollRTL: {
    flexDirection: 'row-reverse',
  },
  timelineDay: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    minWidth: 70,
  },
  timelineDayToday: {
    backgroundColor: '#FCE4EC',
    borderWidth: 2,
    borderColor: '#E91E63',
  },
  timelineWeekday: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  timelineDayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  timelineTextToday: {
    color: '#E91E63',
  },
  stockIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockIndicatorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    marginBottom: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  legendItem: {
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#757575',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDate: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F0F0F0',
  },
  modalButtonSave: {
    backgroundColor: '#E91E63',
  },
  modalButtonCancelText: {
    color: '#757575',
    fontWeight: '600',
  },
  modalButtonSaveText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default ProductCalendar;
