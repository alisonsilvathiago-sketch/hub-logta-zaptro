import React from 'react';
import { ImageIcon } from 'lucide-react';

type Props = {
  src?: string | null;
  name: string;
  size?: number;
};

const ProductThumb: React.FC<Props> = ({ src, name, size = 32 }) => (
  <span
    className={`ls-product-thumb${src ? '' : ' ls-product-thumb--empty'}`}
    style={{ width: size, height: size, borderRadius: size <= 28 ? 8 : 10 }}
  >
    {src ? (
      <img src={src} alt="" width={size} height={size} className="ls-product-thumb__img" />
    ) : (
      <ImageIcon size={16} strokeWidth={2} aria-hidden />
    )}
    <span className="sr-only">{name}</span>
  </span>
);

export default ProductThumb;
