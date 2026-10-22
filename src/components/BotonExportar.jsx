import React, { useState } from 'react';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';

import FileDownloadIcon from '@mui/icons-material/FileDownload';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintIcon from '@mui/icons-material/Print';
import TableViewIcon from '@mui/icons-material/TableView';

const BotonExportar = ({ onExportPDF, onExportExcel, disabled = false }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (tipo) => {
    if (tipo === 'PDF' && onExportPDF) {
      onExportPDF();
    } else if (tipo === 'Impresión Rápida') {
      window.print(); // Dispara el equivalente a Ctrl+P
    }
    if (tipo === 'Excel' && onExportExcel) {
      onExportExcel();
    }
    handleClose();
  };

  return (
    <>
      <Button
        variant="outlined"
        onClick={handleClick}
        disabled={disabled}
        startIcon={<FileDownloadIcon />}
        endIcon={<KeyboardArrowDownIcon />}
        sx={{ 
          backgroundColor: '#fff', 
          color: '#424242', 
          borderColor: '#bdbdbd', 
          textTransform: 'none',
          borderRadius: '8px',
          '&:hover': { backgroundColor: '#f5f5f5', borderColor: '#9e9e9e' }
        }}
      >
        Exportar
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleExport('Impresión Rápida')}>
          <ListItemIcon>
            <PrintIcon fontSize="small" sx={{ color: '#424242' }} />
          </ListItemIcon>
          <ListItemText>Impresión Rápida</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => handleExport('PDF')}>
          <ListItemIcon>
            <PictureAsPdfIcon fontSize="small" sx={{ color: '#d32f2f' }} />
          </ListItemIcon>
          <ListItemText>Exportar a PDF</ListItemText>
        </MenuItem>

        {onExportExcel && <Divider />}

        {onExportExcel && (
          <MenuItem onClick={() => handleExport('Excel')}>
            <ListItemIcon>
              <TableViewIcon fontSize="small" sx={{ color: '#2e7d32' }} />
            </ListItemIcon>
            <ListItemText>Exportar a Excel</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default BotonExportar;