import { List } from '@mui/material';
import React from 'react'



const ListCustom = ({ children, ...props }: any) => (
    <List sx={{ p: 0 }} {...props}>
        {children}
    </List>
)


export default ListCustom