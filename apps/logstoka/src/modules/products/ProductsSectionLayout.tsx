import React from 'react';
import { Outlet } from 'react-router-dom';

const ProductsSectionLayout: React.FC = () => (
  <div className="ls-products-section space-y-5">
    <Outlet />
  </div>
);

export default ProductsSectionLayout;
