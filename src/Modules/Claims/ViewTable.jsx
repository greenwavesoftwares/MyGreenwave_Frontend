import React from 'react'

const ViewTable = (claim_id) => {

    
  return (
    <DataTable value={products} showGridlines tableStyle={{ minWidth: '50rem' }}>
    <Column field="code" header="Code"></Column>
    <Column field="name" header="Name"></Column>
    <Column field="category" header="Category"></Column>
    <Column field="quantity" header="Quantity"></Column>
</DataTable>
  )
}

export default ViewTable