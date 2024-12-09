import { IconButton, ListItem, ListItemButton, ListItemText } from '@mui/material'
import { useNavigate } from 'react-router'
import Iconify from '../iconify'


interface ListItemCustomProps {
    link: string;
    text: string;
    selected: boolean;
    onDelete: () => any;
}

const ListItemCustom = ({ link, text, selected, onDelete, ...props }: ListItemCustomProps) => {
    const navigate = useNavigate()
    return (
        <ListItem
            disablePadding
            sx={{ borderRadius: 1, py: 0 }}
            secondaryAction={
                <IconButton onClick={() => onDelete()} edge="end">
                    <Iconify icon="tabler:trash-filled" sx={{ color: 'error.main' }} />
                </IconButton>
            }
            {...props} >
            <ListItemButton sx={{ borderRadius: 1 }} selected={selected} onClick={() => navigate(link)}>
                <ListItemText primary={text} />
            </ListItemButton>
        </ListItem>
    )
}

export default ListItemCustom