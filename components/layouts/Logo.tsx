import React from 'react'
import Image from "next/image";
const Logo = () => {
  return (
    <> {/* Light mode logo */}
              <Image
                src="/images/toilogo.png"
                alt="Town of Islip"
                width={32}
                height={32}
                className="block dark:hidden"
              />
              {/* Dark mode logo */}
              <Image
                src="/images/seal_blue_sm.png"
                alt="Town of Islip"
                width={32}
                height={32}
                className="hidden dark:block"
      />
    </>
  )
}

export default Logo
