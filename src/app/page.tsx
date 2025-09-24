import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Store Courier
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Система управления доставкой товаров с интеграцией Prisma и PostgreSQL
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🛍️ Товары</CardTitle>
              <CardDescription>
                Управление каталогом товаров, категориями и характеристиками
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Перейти к товарам
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📦 Заказы</CardTitle>
              <CardDescription>
                Отслеживание заказов, статусы доставки и управление курьерами
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Управление заказами
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">👥 Пользователи</CardTitle>
              <CardDescription>
                Система ролей: администраторы, продавцы и курьеры
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Пользователи
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🗄️ База данных готова!</CardTitle>
            <CardDescription>
              Prisma интегрирован с вашей схемой PostgreSQL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Модели данных:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• User (Пользователи с ролями)</li>
                  <li>• Product (Товары с характеристиками)</li>
                  <li>• Category (Категории и подкатегории)</li>
                  <li>• Order (Заказы и их статусы)</li>
                  <li>• Review (Отзывы о товарах)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Следующие шаги:</h4>
                <ol className="text-sm text-gray-600 space-y-1">
                  <li>1. Настройте DATABASE_URL в .env</li>
                  <li>2. Выполните: <code className="bg-gray-100 px-1 rounded">npx prisma db push</code></li>
                  <li>3. Создайте API роуты для CRUD операций</li>
                  <li>4. Добавьте компоненты для управления данными</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
