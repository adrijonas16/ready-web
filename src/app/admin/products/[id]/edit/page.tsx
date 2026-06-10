'use client';

import { use } from 'react';
import ProductWizard from '../../_wizard';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ProductWizard productId={id} />;
}
