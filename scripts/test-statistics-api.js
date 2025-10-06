const fetch = require('node-fetch');

async function testStatisticsAPI() {
  const baseUrl = 'http://localhost:3000';
  
  // Тестируем разные периоды
  const periods = ['today', 'yesterday', 'week', 'month', 'all'];
  
  console.log('🧪 Тестируем API статистики...\n');
  
  for (const period of periods) {
    try {
      console.log(`📊 Тестируем период: ${period}`);
      
      const response = await fetch(`${baseUrl}/api/courier/statistics?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'auth-token=test-token' // Замените на реальный токен
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const summary = data.data.summary;
        console.log(`✅ ${period}:`);
        console.log(`   - Всего заказов: ${summary.totalOrders}`);
        console.log(`   - Доставлено: ${summary.completedOrders}`);
        console.log(`   - В пути: ${summary.inProgressOrders}`);
        console.log(`   - Отменено: ${summary.canceledOrders}`);
        console.log(`   - Заработано: ${summary.totalRevenue} сом`);
        console.log('');
      } else {
        console.log(`❌ ${period}: Ошибка - ${data.error}`);
        console.log('');
      }
    } catch (error) {
      console.log(`❌ ${period}: Ошибка запроса - ${error.message}`);
      console.log('');
    }
  }
}

// Запускаем тест
testStatisticsAPI().catch(console.error);
