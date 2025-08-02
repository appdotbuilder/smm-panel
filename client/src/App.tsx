
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { 
  Service, 
  Category, 
  Order, 
  Transaction, 
  User,
  CreateOrderInput, 
  CreateTransactionInput,
  CreateServiceInput,
  CreateCategoryInput
} from '../../server/src/schema';

// Placeholder user data - this would come from authentication context in a real app
const currentUser: User = {
  id: 1,
  username: 'demo_user',
  email: 'demo@example.com',
  password_hash: '',
  balance: 250.75,
  role: 'user',
  api_key: 'sk_test_123456789',
  created_at: new Date(),
  updated_at: new Date()
};

function App() {
  // State management
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('services');
  
  // Order form state
  const [orderFormData, setOrderFormData] = useState<CreateOrderInput & { userId: number }>({
    service_id: 0,
    quantity: 0,
    target_url: '',
    drip_feed_enabled: false,
    drip_feed_runs: undefined,
    drip_feed_interval: undefined,
    userId: currentUser.id
  });
  
  // Deposit form state
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [cryptoCurrency, setCryptoCurrency] = useState<string>('bitcoin');
  
  // Admin forms state
  const [serviceFormData, setServiceFormData] = useState<CreateServiceInput>({
    category_id: 0,
    name: '',
    description: '',
    price_per_unit: 0,
    min_quantity: 1,
    max_quantity: 10000,
    average_delivery_time: 24,
    supports_drip_feed: false
  });
  
  const [categoryFormData, setCategoryFormData] = useState<CreateCategoryInput>({
    name: '',
    description: null
  });

  // Load data functions
  const loadServices = useCallback(async () => {
    try {
      const result = await trpc.getServices.query();
      setServices(result);
    } catch (error) {
      console.error('Failed to load services:', error);
      // Fallback data when API is not available
      setServices([
        {
          id: 1,
          category_id: 1,
          name: '🔥 Instagram Followers - High Quality',
          description: 'Premium Instagram followers with guaranteed retention. Real accounts with profile pictures.',
          price_per_unit: 0.002,
          min_quantity: 100,
          max_quantity: 50000,
          average_delivery_time: 2,
          supports_drip_feed: true,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          category_id: 1,
          name: '❤️ Instagram Likes - Instant',
          description: 'Fast Instagram likes delivery. Start within 1 hour, complete in 24 hours.',
          price_per_unit: 0.001,
          min_quantity: 50,
          max_quantity: 10000,
          average_delivery_time: 1,
          supports_drip_feed: true,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          category_id: 2,
          name: '🎵 TikTok Views - Worldwide',
          description: 'High-quality TikTok views from real users worldwide. Boost your video visibility.',
          price_per_unit: 0.0005,
          min_quantity: 1000,
          max_quantity: 1000000,
          average_delivery_time: 6,
          supports_drip_feed: true,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 4,
          category_id: 3,
          name: '👍 YouTube Likes - Real Users',
          description: 'Organic YouTube likes from active accounts. Improve your video engagement.',
          price_per_unit: 0.003,
          min_quantity: 25,
          max_quantity: 5000,
          average_delivery_time: 12,
          supports_drip_feed: false,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Fallback data when API is not available
      setCategories([
        { id: 1, name: '📸 Instagram', description: 'Instagram services', created_at: new Date() },
        { id: 2, name: '🎵 TikTok', description: 'TikTok services', created_at: new Date() },
        { id: 3, name: '📺 YouTube', description: 'YouTube services', created_at: new Date() },
        { id: 4, name: '👥 Facebook', description: 'Facebook services', created_at: new Date() },
        { id: 5, name: '🐦 Twitter', description: 'Twitter services', created_at: new Date() }
      ]);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const result = await trpc.getOrders.query({ userId: currentUser.role === 'admin' ? undefined : currentUser.id });
      setOrders(result);
    } catch (error) {
      console.error('Failed to load orders:', error);
      // Fallback data when API is not available
      setOrders([
        {
          id: 1,
          user_id: currentUser.id,
          service_id: 1,
          quantity: 1000,
          total_price: 2.00,
          target_url: 'https://instagram.com/p/example',
          drip_feed_enabled: true,
          drip_feed_runs: 10,
          drip_feed_interval: 60,
          status: 'in_progress',
          start_count: 1250,
          remains: 600,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
          updated_at: new Date()
        },
        {
          id: 2,
          user_id: currentUser.id,
          service_id: 2,
          quantity: 500,
          total_price: 0.50,
          target_url: 'https://instagram.com/p/example2',
          drip_feed_enabled: false,
          drip_feed_runs: null,
          drip_feed_interval: null,
          status: 'completed',
          start_count: 125,
          remains: 0,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
          updated_at: new Date()
        }
      ]);
    }
  }, [currentUser.id, currentUser.role]);

  const loadTransactions = useCallback(async () => {
    try {
      const result = await trpc.getTransactions.query({ userId: currentUser.role === 'admin' ? undefined : currentUser.id });
      setTransactions(result);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      // Fallback data when API is not available
      setTransactions([
        {
          id: 1,
          user_id: currentUser.id,
          type: 'deposit',
          amount: 50.00,
          description: 'Bitcoin deposit',
          crypto_currency: 'BTC',
          crypto_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          crypto_tx_hash: '0x123...abc',
          status: 'completed',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        {
          id: 2,
          user_id: currentUser.id,
          type: 'order',
          amount: -2.50,
          description: 'Order #1 - Instagram Followers',
          crypto_currency: null,
          crypto_address: null,
          crypto_tx_hash: null,
          status: 'completed',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }
      ]);
    }
  }, [currentUser.id, currentUser.role]);

  const loadUsers = useCallback(async () => {
    if (currentUser.role !== 'admin') return;
    try {
      const result = await trpc.getUsers.query();
      setUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
      // Fallback data when API is not available
      setUsers([
        currentUser,
        {
          id: 2,
          username: 'john_doe',
          email: 'john@example.com',
          password_hash: '',
          balance: 125.50,
          role: 'user',
          api_key: 'sk_test_987654321',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          updated_at: new Date()
        }
      ]);
    }
  }, [currentUser.role]);

  // Load all data on mount
  useEffect(() => {
    loadServices();
    loadCategories();
    loadOrders();
    loadTransactions();
    loadUsers();
  }, [loadServices, loadCategories, loadOrders, loadTransactions, loadUsers]);

  // Filter services
  const filteredServices = services.filter((service: Service) => {
    const matchesCategory = selectedCategory === 'all' || service.category_id.toString() === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && service.is_active;
  });

  // Handle order placement
  const handlePlaceOrder = async (service: Service) => {
    if (!orderFormData.target_url || orderFormData.quantity < service.min_quantity || orderFormData.quantity > service.max_quantity) {
      alert('Please check your order details');
      return;
    }

    const totalCost = orderFormData.quantity * service.price_per_unit;
    if (totalCost > currentUser.balance) {
      alert('Insufficient balance. Please deposit funds first.');
      return;
    }

    setIsLoading(true);
    try {
      await trpc.createOrder.mutate({
        ...orderFormData,
        service_id: service.id,
        userId: currentUser.id
      });
      alert('Order placed successfully!');
      loadOrders();
      setOrderFormData({
        service_id: 0,
        quantity: 0,
        target_url: '',
        drip_feed_enabled: false,
        drip_feed_runs: undefined,
        drip_feed_interval: undefined,
        userId: currentUser.id
      });
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deposit
  const handleDeposit = async () => {
    if (depositAmount <= 0) {
      alert('Invalid deposit amount');
      return;
    }

    setIsLoading(true);
    try {
      const transactionData: CreateTransactionInput = {
        user_id: currentUser.id,
        type: 'deposit',
        amount: depositAmount,
        description: `${cryptoCurrency.toUpperCase()} deposit`,
        crypto_currency: cryptoCurrency.toUpperCase()
      };
      
      await trpc.createTransaction.mutate(transactionData);
      alert('Deposit request created! Please send payment to the provided address.');
      loadTransactions();
      setDepositAmount(0);
    } catch (error) {
      console.error('Failed to create deposit:', error);
      alert('Failed to create deposit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Admin functions
  const handleCreateService = async () => {
    if (!serviceFormData.name || !serviceFormData.description || serviceFormData.category_id === 0) {
      alert('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await trpc.createService.mutate(serviceFormData);
      alert('Service created successfully!');
      loadServices();
      setServiceFormData({
        category_id: 0,
        name: '',
        description: '',
        price_per_unit: 0,
        min_quantity: 1,
        max_quantity: 10000,
        average_delivery_time: 24,
        supports_drip_feed: false
      });
    } catch (error) {
      console.error('Failed to create service:', error);
      alert('Failed to create service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryFormData.name) {
      alert('Category name is required');
      return;
    }

    setIsLoading(true);
    try {
      await trpc.createCategory.mutate(categoryFormData);
      alert('Category created successfully!');
      loadCategories();
      setCategoryFormData({ name: '', description: null });
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      case 'partial': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'text-green-600';
      case 'order': return 'text-red-600';
      case 'refund': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🚀 SMM Panel Pro
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome, {currentUser.username}</p>
                <p className="text-lg font-semibold text-green-600">${currentUser.balance.toFixed(2)}</p>
              </div>
              <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'}>
                {currentUser.role === 'admin' ? '👑 Admin' : '👤 User'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="services">🛍️ Services</TabsTrigger>
            <TabsTrigger value="orders">📋 My Orders</TabsTrigger>
            <TabsTrigger value="wallet">💳 Wallet</TabsTrigger>
            <TabsTrigger value="api">🔑 API</TabsTrigger>
            {currentUser.role === 'admin' && (
              <TabsTrigger value="admin">⚙️ Admin</TabsTrigger>
            )}
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <Input
                  placeholder="🔍 Search services..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="max-w-sm">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service: Service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg leading-tight">{service.name}</CardTitle>
                      <Badge variant="outline" className="ml-2">
                        {categories.find((c: Category) => c.id === service.category_id)?.name || 'Unknown'}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">💰 Price per unit</p>
                        <p className="font-semibold">${service.price_per_unit.toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">⚡ Delivery</p>
                        <p className="font-semibold">{service.average_delivery_time}h</p>
                      </div>
                      <div>
                        <p className="text-gray-600">📊 Min/Max</p>
                        <p className="font-semibold">{service.min_quantity} - {service.max_quantity.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">🔄 Drip Feed</p>
                        <p className="font-semibold">{service.supports_drip_feed ? '✅ Yes' : '❌ No'}</p>
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                          🛒 Order Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Place Order</DialogTitle>
                          <DialogDescription>{service.name}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="target_url">Target URL</Label>
                            <Input
                              id="target_url"
                              placeholder="https://..."
                              value={orderFormData.target_url}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setOrderFormData((prev: CreateOrderInput & { userId: number }) => ({ ...prev, target_url: e.target.value }))
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="quantity">Quantity ({service.min_quantity} - {service.max_quantity.toLocaleString()})</Label>
                            <Input
                              id="quantity"
                              type="number"
                              min={service.min_quantity}
                              max={service.max_quantity}
                              value={orderFormData.quantity}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setOrderFormData((prev: CreateOrderInput & { userId: number }) => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))
                              }
                            />
                          </div>
                          {service.supports_drip_feed && (
                            <>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="drip_feed"
                                  checked={orderFormData.drip_feed_enabled}
                                  onCheckedChange={(checked: boolean) =>
                                    setOrderFormData((prev: CreateOrderInput & { userId: number }) => ({ ...prev, drip_feed_enabled: checked }))
                                  }
                                />
                                <Label htmlFor="drip_feed">Enable Drip Feed</Label>
                              </div>
                              {orderFormData.drip_feed_enabled && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="drip_runs">Runs</Label>
                                    <Input
                                      id="drip_runs"
                                      type="number"
                                      min="1"
                                      value={orderFormData.drip_feed_runs || ''}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setOrderFormData((prev: CreateOrderInput & { userId: number }) => ({ ...prev, drip_feed_runs: parseInt(e.target.value) || undefined }))
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="drip_interval">Interval (minutes)</Label>
                                    <Input
                                      id="drip_interval"
                                      type="number"
                                      min="1"
                                      value={orderFormData.drip_feed_interval || ''}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setOrderFormData((prev: CreateOrderInput & { userId: number }) => ({ ...prev, drip_feed_interval: parseInt(e.target.value) || undefined }))
                                      }
                                    />
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">Total Cost:</p>
                            <p className="text-lg font-bold text-green-600">
                              ${(orderFormData.quantity * service.price_per_unit).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => handlePlaceOrder(service)}
                            disabled={isLoading}
                            className="w-full"
                          >
                            {isLoading ? 'Placing Order...' : 'Place Order'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredServices.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No services found matching your criteria</p>
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📋 Order History</CardTitle>
                <CardDescription>Track your orders and their progress</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No orders yet. Start by browsing our services!</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: Order) => {
                      const service = services.find((s: Service) => s.id === order.service_id);
                      const progress = order.remains !== null && order.quantity > 0 
                        ? ((order.quantity - order.remains) / order.quantity) * 100 
                        : 0;
                        
                      return (
                        <Card key={order.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-semibold">{service?.name || 'Unknown Service'}</h3>
                                <p className="text-sm text-gray-600">Order #{order.id}</p>
                                <p className="text-sm text-gray-600">{order.target_url}</p>
                              </div>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.toUpperCase()}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                              <div>
                                <p className="text-gray-600">Quantity</p>
                                <p className="font-semibold">{order.quantity.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Total Price</p>
                                <p className="font-semibold">${order.total_price.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Start Count</p>
                                <p className="font-semibold">{order.start_count?.toLocaleString() || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Remains</p>
                                <p className="font-semibold">{order.remains?.toLocaleString() || 'N/A'}</p>
                              </div>
                            </div>

                            {order.status === 'in_progress' && order.remains !== null && (
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Progress</span>
                                  <span>{progress.toFixed(1)}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                              </div>
                            )}

                            {order.drip_feed_enabled && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm font-medium text-blue-800">🔄 Drip Feed Enabled</p>
                                <p className="text-sm text-blue-600">
                                  {order.drip_feed_runs} runs, {order.drip_feed_interval} min intervals
                                </p>
                              </div>
                            )}

                            <div className="mt-3 text-xs text-gray-500">
                              Created: {order.created_at.toLocaleString()}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Balance Card */}
              <Card>
                <CardHeader>
                  <CardTitle>💳 Current Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-4">
                    ${currentUser.balance.toFixed(2)}
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-green-500 hover:bg-green-600">
                        💰 Add Funds
                      
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Funds</DialogTitle>
                        <DialogDescription>Deposit cryptocurrency to your account</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="amount">Amount (USD)</Label>
                          <Input
                            id="amount"
                            type="number"
                            min="1"
                            step="0.01"
                            value={depositAmount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepositAmount(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="crypto">Cryptocurrency</Label>
                          <Select value={cryptoCurrency} onValueChange={setCryptoCurrency}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bitcoin">₿ Bitcoin (BTC)</SelectItem>
                              <SelectItem value="ethereum">Ξ Ethereum (ETH)</SelectItem>
                              <SelectItem value="litecoin">Ł Litecoin (LTC)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleDeposit} disabled={isLoading} className="w-full">
                          {isLoading ? 'Creating Deposit...' : 'Create Deposit'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Transaction History */}
              <Card>
                <CardHeader>
                  <CardTitle>📊 Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No transactions yet</p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {transactions.slice(0, 10).map((transaction: Transaction) => (
                        <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-600">{transaction.created_at.toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                              {transaction.type === 'order' ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                            </p>
                            <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🔑 API Access</CardTitle>
                <CardDescription>Use our API to integrate SMM services into your applications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="api_key">Your API Key</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="api_key"
                      value={currentUser.api_key || 'Not generated'}
                      readOnly
                      className="font-mono"
                    />
                    <Button variant="outline" size="sm">
                      📋 Copy
                    </Button>
                  </div>
                </div>
                
                <Alert>
                  <AlertDescription>
                    Keep your API key secure! It provides full access to your account for placing orders and checking balances.
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">📚 API Documentation</h4>
                  <p className="text-sm text-gray-600 mb-2">Base URL: <code className="bg-gray-200 px-1 rounded">https://api.yourpanel.com</code></p>
                  <p className="text-sm text-gray-600">
                    Use your API key in the Authorization header: <code className="bg-gray-200 px-1 rounded">Bearer {currentUser.api_key}</code>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Tab */}
          {currentUser.role === 'admin' && (
            <TabsContent value="admin" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Create Service */}
                <Card>
                  <CardHeader>
                    <CardTitle>➕ Create Service</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="service_category">Category</Label>
                      <Select 
                        value={serviceFormData.category_id.toString()} 
                        onValueChange={(value: string) => setServiceFormData((prev: CreateServiceInput) => ({ ...prev, category_id: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category: Category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="service_name">Service Name</Label>
                      <Input
                        id="service_name"
                        value={serviceFormData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setServiceFormData((prev: CreateServiceInput) => ({ ...prev, name: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="service_description">Description</Label>
                      <Textarea
                        id="service_description"
                        value={serviceFormData.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setServiceFormData((prev: CreateServiceInput) => ({ ...prev, description: e.target.value }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price_per_unit">Price per Unit</Label>
                        <Input
                          id="price_per_unit"
                          type="number"
                          step="0.0001"
                          value={serviceFormData.price_per_unit}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setServiceFormData((prev: CreateServiceInput) => ({ ...prev, price_per_unit: parseFloat(e.target.value) || 0 }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="delivery_time">Delivery Time (hours)</Label>
                        <Input
                          id="delivery_time"
                          type="number"
                          value={serviceFormData.average_delivery_time}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setServiceFormData((prev: CreateServiceInput) => ({ ...prev, average_delivery_time: parseInt(e.target.value) || 0 }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="min_quantity">Min Quantity</Label>
                        <Input
                          id="min_quantity"
                          type="number"
                          value={serviceFormData.min_quantity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setServiceFormData((prev: CreateServiceInput) => ({ ...prev, min_quantity: parseInt(e.target.value) || 0 }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_quantity">Max Quantity</Label>
                        <Input
                          id="max_quantity"
                          type="number"
                          value={serviceFormData.max_quantity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setServiceFormData((prev: CreateServiceInput) => ({ ...prev, max_quantity: parseInt(e.target.value) || 0 }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="supports_drip_feed"
                        checked={serviceFormData.supports_drip_feed}
                        onCheckedChange={(checked: boolean) =>
                          setServiceFormData((prev: CreateServiceInput) => ({ ...prev, supports_drip_feed: checked }))
                        }
                      />
                      <Label htmlFor="supports_drip_feed">Supports Drip Feed</Label>
                    </div>
                    <Button onClick={handleCreateService} disabled={isLoading} className="w-full">
                      {isLoading ? 'Creating...' : 'Create Service'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Create Category */}
                <Card>
                  <CardHeader>
                    <CardTitle>📁 Create Category</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="category_name">Category Name</Label>
                      <Input
                        id="category_name"
                        value={categoryFormData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCategoryFormData((prev: CreateCategoryInput) => ({ ...prev, name: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="category_description">Description (Optional)</Label>
                      <Textarea
                        id="category_description"
                        value={categoryFormData.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setCategoryFormData((prev: CreateCategoryInput) => ({ ...prev, description: e.target.value || null }))
                        }
                      />
                    </div>
                    <Button onClick={handleCreateCategory} disabled={isLoading} className="w-full">
                      {isLoading ? 'Creating...' : 'Create Category'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Users Management */}
              <Card>
                <CardHeader>
                  <CardTitle>👥 Users Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user: User) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell className="text-green-600 font-semibold">${user.balance.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.created_at.toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

export default App;
