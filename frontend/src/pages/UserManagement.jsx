import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Pagination,
} from '@mui/material';
import {
  MoreVert,
  Delete,
  Edit,
  Search,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [roleDialog, setRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const usersPerPage = 10;
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      setError('Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    // Don't clear selectedUser here, it's needed for dialogs
  };

  const handleDeleteClick = () => {
    if (selectedUser) {
      setDeleteDialog(true);
      handleMenuClose();
    }
  };

  const handleRoleChangeClick = () => {
    if (selectedUser) {
      setNewRole(selectedUser.role);
      setRoleDialog(true);
      handleMenuClose();
    }
  };

  const handleDelete = async () => {
    if (!selectedUser || !selectedUser._id) {
      setError('Kullanıcı seçilmedi');
      setDeleteDialog(false);
      return;
    }
    
    try {
      setError('');
      await axios.delete(`/api/users/${selectedUser._id}`);
      setSuccess(`${selectedUser.fullName || selectedUser.username} kullanıcısı silindi`);
      setDeleteDialog(false);
      setSelectedUser(null);
      await fetchUsers();
      // Reset to first page if current page becomes empty
      const newFiltered = users.filter((user) => {
        const query = searchQuery.toLowerCase();
        return (
          user.fullName?.toLowerCase().includes(query) ||
          user.username?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
        );
      });
      if (page > 1 && newFiltered.length <= (page - 1) * usersPerPage) {
        setPage(1);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Delete error:', error);
      }
      setError(error.response?.data?.message || error.message || 'Kullanıcı silinemedi');
      setDeleteDialog(false);
    }
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser || !selectedUser._id || !newRole) {
      setError('Kullanıcı veya rol seçilmedi');
      setRoleDialog(false);
      return;
    }
    
    try {
      setError('');
      await axios.patch(`/api/users/${selectedUser._id}/role`, { role: newRole });
      setSuccess(`${selectedUser.fullName || selectedUser.username} kullanıcısının rolü güncellendi`);
      setRoleDialog(false);
      setSelectedUser(null);
      setNewRole('');
      await fetchUsers();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Role update error:', error);
      }
      setError(error.response?.data?.message || error.message || 'Rol güncellenemedi');
      setRoleDialog(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'primary';
      case 'ceza':
        return 'warning';
      case 'uye':
        return 'default';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'ceza':
        return 'Ceza';
      case 'uye':
        return 'Üye';
      default:
        return role;
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.fullName?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  if (currentUser?.role !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error">Bu sayfaya erişim yetkiniz bulunmamaktadır.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Kullanıcı Yönetimi
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Kullanıcıları görüntüleyin, rollerini değiştirin veya silin
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            Kullanıcılar ({filteredUsers.length})
          </Typography>
          <TextField
            size="small"
            placeholder="Ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 250 }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Kullanıcı</TableCell>
                  <TableCell>E-posta</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers
                  .slice((page - 1) * usersPerPage, page * usersPerPage)
                  .map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar 
                          src={
                            user.profileImage
                              ? (() => {
                                  if (user.profileImage.startsWith('http://') || user.profileImage.startsWith('https://')) {
                                    return user.profileImage;
                                  }
                                  if (user.profileImage.startsWith('data:')) {
                                    return user.profileImage;
                                  }
                                  const baseURL = axios.defaults.baseURL || window.location.origin;
                                  return `${baseURL}${user.profileImage.startsWith('/') ? '' : '/'}${user.profileImage}`;
                                })()
                              : undefined
                          } 
                          sx={{ width: 32, height: 32 }}
                        >
                          {getInitials(user.fullName)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {user.fullName || user.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            @{user.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(user.role)}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive !== false ? 'Aktif' : 'Pasif'}
                        color={user.isActive !== false ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {user._id !== currentUser?._id && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, user)}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        Kullanıcı bulunamadı
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {filteredUsers.length > usersPerPage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={Math.ceil(filteredUsers.length / usersPerPage)}
              page={page}
              onChange={(e, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleRoleChangeClick}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Rolü Değiştir
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Sil
        </MenuItem>
      </Menu>

      {/* Delete Dialog */}
      <Dialog 
        open={deleteDialog} 
        onClose={() => {
          setDeleteDialog(false);
          setSelectedUser(null);
        }}
      >
        <DialogTitle>Kullanıcıyı Sil</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{selectedUser?.fullName || selectedUser?.username}</strong> kullanıcısını silmek istediğinize emin misiniz?
            Bu işlem geri alınamaz.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteDialog(false);
              setSelectedUser(null);
            }}
          >
            İptal
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={!selectedUser}
          >
            Sil
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog 
        open={roleDialog} 
        onClose={() => {
          setRoleDialog(false);
          setSelectedUser(null);
          setNewRole('');
        }}
      >
        <DialogTitle>Rolü Değiştir</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            <strong>{selectedUser?.fullName || selectedUser?.username}</strong> kullanıcısının rolünü değiştir
          </DialogContentText>
          <FormControl fullWidth>
            <InputLabel>Rol</InputLabel>
            <Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              label="Rol"
            >
              <MenuItem value="uye">Üye</MenuItem>
              <MenuItem value="ceza">Ceza</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
            {newRole && newRole === selectedUser?.role && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Bu kullanıcı zaten {getRoleLabel(newRole)} rolüne sahip.
              </Typography>
            )}
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setRoleDialog(false);
              setSelectedUser(null);
              setNewRole('');
            }}
          >
            İptal
          </Button>
          <Button 
            onClick={handleRoleUpdate} 
            variant="contained" 
            disabled={!newRole || !selectedUser || newRole === selectedUser?.role}
          >
            Güncelle
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;

