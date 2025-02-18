import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ProductDetail = () => {
  const { barcode } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductInfo = async () => {
      try {
        setLoading(true);
        
        // Sử dụng Scandit Product API
        const response = await axios.get(
          `https://api.scandit.com/v2/products/${barcode}`,
          {
            headers: {
              'Authorization': `Alq1Dz0HG70QNICuKsipTO0vzY80MUQvfye/hPsMq8IncoaDA39Nu6Jw+eZ6R+juKE1McupPR9ewYRtu3UEC86Y9aSoEBbSuI13hJTIFgBJkVKwdPz6RmsQm2n1zGzemUziV1VV8uF09HK3nwEUY/Y93Hw4EFCIU7DWhylEmt0F8bm/WN3peduwY3gIwIPBpnCWroe4onmU8dCtfPU6UiYl9G4IVFGVIiRgu0p4jHvQbFg+b7xVaB7xqYfKBVOOCeASIOjgZjsoPMSdZWhhMnHwoDR03HZH/8CdEzbsejS3ACrgEzRDLZ8gxCYxLKo1FdgQC9xcMgIh0GUI+ZyzX7yQRVM7eQT/H+U8YvTl0ma0iPaPIsTHRdY8eqvR5XgZPX13HKJlU4+TXa5M2TwE5dltS/fF4THNn1XW4fUY/JoQsQy7vsgz3R3BD+yLcdAIC23q5S857jkztbXUI7TP5sGl7W1uDeDCa+mgA9woNOuKdXu0SIHccM7Qj8zLWIiaYvHuR7aZ2HO7QQj0JEgL2Hd5wCWehUPll2l/K5M9XCkH6FGrLj35GkYxbpa6XanB7bwrE1w5oW8IAXG5QsncfwUFN9+P1RYcMV08w8G5S/0vLTjfQRjLEtbEBl6D2A+IMPHq4ByByUYeeJo7DaHdRtdZsWkYQDFTvDkROhYccU8MhGGo30nQvHZ9er72pfUAyhG/tYLUgcOC+eG4T3EJryT1KfvZTeBsoQhxLgfhcmf/mEBl03Q2x54cNR7EOkg2bL6axFumL0nsiOxhAiMKajFw9JOSGJRqT3xPBD6ctqb4OxCPhS4Qd0lLF35JknnFlDpSYMshSYN32h4EkOu11rof45pWcKOjtqyoCZxqihnkxMHwYST+v+wGups3i7E+M+THEJGb69R3Ea+9FMyDl95XyoqYVtemBlDic5ts/ARUEYoxetsos+4qbxC98P5DuvcLJgJElNP/PNQJ3O3O4TjsnchIyOZgeBTiT+vtJjI/1t/BUgKpqpRB65iCRMy7lCPZGFGGuek5RtuydQ4VZ8PzaoiQi9Bke0Kuo+PdcMI82utljYsbMMWDUKe0n95MNYSveFRSOCsDO55IWJ+mP5lhDWyIEM17o96or5bZ13VZOkWbISOyQAWndssvKub3DpJGfH89XvosdqB0C5K1JTxn8DmH4W6JfUVvGDYZZ9R2o+3FcwdzcMr/6i+xB9MJtBew3W3oei/TTKiFmV3d92M7++7fP+ABCgI5jI3AlhgPw2uxV+wnsw465R3V8tzoO/ljh9KElSZRdRwiR6WWD0dADiG5Vln8g/Jsq0DNP1w3ViTZGFlGN0XvImHW2dOBxOfmdxrbNgZvZfpVt2H/gDHnlhPp4dwq4j6XmQ0XDwOcdFM0BYo35nPzNDKf0BrfQtFA6fm3LfT2nmWpU1n9Po3mvHJ02ovHRauax/g==`, // Thay thế bằng API key của bạn
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data) {
          setProduct(response.data);
        } else {
          setError('Không tìm thấy thông tin sản phẩm');
        }
      } catch (err) {
        setError('Không thể tìm thấy thông tin sản phẩm');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    if (barcode) {
      fetchProductInfo();
    }
  }, [barcode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Lỗi</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* Product Image */}
          <div className="md:flex-shrink-0">
            {product.images && product.images.length > 0 ? (
              <img
                className="h-64 w-full object-cover md:w-96"
                src={product.images[0]}
                alt={product.name}
              />
            ) : (
              <div className="h-64 w-full md:w-96 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">Không có hình ảnh</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-8">
            <div className="text-sm text-gray-500 mb-1">Mã vạch: {barcode}</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{product.name}</h2>
            
            {product.brand && (
              <div className="mb-4">
                <span className="font-semibold">Thương hiệu:</span>
                <span className="ml-2">{product.brand}</span>
              </div>
            )}

            {product.gtin && (
              <div className="mb-4">
                <span className="font-semibold">GTIN:</span>
                <span className="ml-2">{product.gtin}</span>
              </div>
            )}

            {product.category && (
              <div className="mb-4">
                <span className="font-semibold">Danh mục:</span>
                <span className="ml-2">{product.category}</span>
              </div>
            )}

            {product.description && (
              <div className="mb-4">
                <span className="font-semibold block mb-2">Mô tả:</span>
                <p className="text-gray-600">{product.description}</p>
              </div>
            )}

            {/* Additional Product Details */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Thông số chi tiết:</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium">{key}:</span>
                      <span className="ml-2 text-gray-600">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail; 