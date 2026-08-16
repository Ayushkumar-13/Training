import React from 'react'

export default function Table({ children, className = '', ...props }){
  return (
    <div className={`overflow-x-auto bg-white text-black rounded ${className}`} {...props}>
      <table className="min-w-full">{children}</table>
    </div>
  )
}
