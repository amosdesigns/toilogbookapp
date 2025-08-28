import React from 'react';
import Image from "next/image";
import { SITE } from '@/StaticData/data';

const Logo = () => {
  return (
    <div className="site-logo p-8">
      <Image
        src={`${SITE.LOGO}`}
        alt={`${SITE.TITLE} Logo`}
        width={200}
        height={200}
        className="h-full w-full object-cover p-8"
      />
    </div>
  )
}

export default Logo
