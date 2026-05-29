import React from 'react';
import { Outlet } from 'react-router-dom';
import ProductsSectionNav from '@/components/products/ProductsSectionNav';

const ProductsSectionLayout: React.FC = () => (
  <div className="space-y-5">
    <ProductsSectionNav />
    <Outlet />
  </div>
);

export default ProductsSectionLayout;
