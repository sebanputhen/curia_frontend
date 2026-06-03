import React, { useState, useEffect, useMemo } from "react";
import { MaterialReactTable } from "material-react-table";
import axiosInstance from "../axiosConfig";
import {
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Box, Typography, IconButton, Tooltip, Card, Avatar, Fade,
  CircularProgress, Snackbar, Alert, CssBaseline, createTheme, ThemeProvider,
  MenuItem, Chip, Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Church as ChurchIcon,
  CalendarMonth as CalendarIcon,
} from "@mui/icons-material";
import { Plus } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Constants ───────────────────────────────────────────────────────────────

const HOME_TYPES = [
  { value: "homeDiocese",   label: "Home Diocese" },
  { value: "otherDiocese",  label: "Other Diocese" },
  { value: "congregation",  label: "Congregation" },
];

const STATUSES = [
  { value: "active",   label: "Active",   color: "#15803D", bg: "#DCFCE7" },
  { value: "inactive", label: "Inactive", color: "#B45309", bg: "#FEF9C3" },
  { value: "retired",  label: "Retired",  color: "#1D4ED8", bg: "#DBEAFE" },
  { value: "died",     label: "Died",     color: "#991B1B", bg: "#FEE2E2" },
];

const statusStyle = (val) => STATUSES.find((s) => s.value === val) || { color: "#6B7280", bg: "#F3F4F6" };

// ─── Theme ────────────────────────────────────────────────────────────────────

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#B45309", light: "#D97706", dark: "#92400E" },
    secondary: { main: "#0F766E", light: "#14B8A6", dark: "#115E59" },
    background: { default: "#FFFBF5", paper: "#FFFFFF" },
    text: { primary: "#1C1917", secondary: "#78716C" },
  },
  typography: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          transition: "all 0.3s ease",
          "&:hover": { transform: "translateY(-3px)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontFamily: "inherit" },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: { fontFamily: "inherit" },
      },
    },
  },
});

// ─── Styled Components ────────────────────────────────────────────────────────

const StyledCard = styled(Card)(() => ({
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  transition: "all 0.3s ease",
  "&:hover": { transform: "translateY(-3px)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" },
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(to right, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
  color: "white",
  "&:hover": { background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.dark})` },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 8,
    fontFamily: "inherit",
    "& fieldset": { borderColor: "#E5E7EB" },
    "&:hover fieldset": { borderColor: theme.palette.primary.light },
    "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
  },
  "& .MuiInputLabel-root": { fontFamily: "inherit" },
}));

const SectionLabel = styled(Typography)(() => ({
  fontFamily: "'Georgia', serif",
  fontWeight: 700,
  fontSize: "0.8rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#B45309",
  marginBottom: 12,
  marginTop: 4,
  display: "flex",
  alignItems: "center",
  gap: 6,
}));

// ─── Default form state ───────────────────────────────────────────────────────

const defaultForm = {
  name: "",
  hame: "",
  dob: "",
  ordinationDate: "",
  email: "",
  phone: "",
  homeType: "",
  homeParish: "",
  homeParishText: "",
  homeCongregation: "",
  status: "active",
  statusDate: "",
  restHome: "",
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Priest = () => {
  const [priests, setPriests] = useState([]);
  const [parishes, setParishes] = useState([]);
  const [congregations, setCongregations] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPriest, setSelectedPriest] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState(defaultForm);

  // Helper to update a single field
  const setField = (key, val) => setFormData((prev) => ({ ...prev, [key]: val }));

  // ── Data fetching ──────────────────────────────────────────────────────────

  useEffect(() => {
    fetchPriests();
    fetchParishes();
    fetchCongregations();
  }, []);

  const fetchPriests = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get("/priest/");
      setPriests(res.data);
      setMessage({ type: "success", text: "Priests fetched successfully" });
    } catch {
      setMessage({ type: "error", text: "Failed to fetch priests" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchParishes = async () => {
    try {
      const res = await axiosInstance.get("/parish/");
      setParishes(res.data);
    } catch { console.error("Failed to fetch parishes"); }
  };

  const fetchCongregations = async () => {
    try {
      const res = await axiosInstance.get("/congregation/");
      setCongregations(res.data);
    } catch { console.error("Failed to fetch congregations"); }
  };

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  const handleEdit = (record) => {
    setIsModalVisible(true);
    setIsEditing(true);
    setSelectedPriest(record);
    setFormData({
      name: record.name || "",
      hname: record.hname || "",
      dob: record.dob ? record.dob.substring(0, 10) : "",
      ordinationDate: record.ordinationDate ? record.ordinationDate.substring(0, 10) : "",
      email: record.email || "",
      phone: record.phone || "",
      homeType: record.homeType || "",
      homeParish: record.homeParish?._id || record.homeParish || "",
      homeParishText: record.homeParishText || "",
      homeCongregation: record.homeCongregation?._id || record.homeCongregation || "",
      status: record.status || "active",
      statusDate: record.statusDate ? record.statusDate.substring(0, 10) : "",
      restHome: record.restHome || "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this priest?")) return;
    try {
      await axiosInstance.delete(`/priest/${id}`);
      fetchPriests();
      setMessage({ type: "success", text: "Priest deleted successfully" });
    } catch {
      setMessage({ type: "error", text: "Failed to delete priest" });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Clean up fields not relevant to current homeType / status
    const payload = { ...formData };
    if (payload.homeType !== "homeDiocese") payload.homeParish = null;
    if (payload.homeType !== "otherDiocese") payload.homeParishText = "";
    if (payload.homeType !== "congregation") payload.homeCongregation = null;
    if (payload.status !== "retired" && payload.status !== "died") payload.statusDate = null;
    if (payload.status !== "retired") payload.restHome = "";

    try {
      if (isEditing) {
        await axiosInstance.put(`/priest/${selectedPriest._id}`, payload);
        setMessage({ type: "success", text: "Priest updated successfully" });
      } else {
        await axiosInstance.post("/priest", payload);
        setMessage({ type: "success", text: "Priest created successfully" });
      }
      fetchPriests();
      setIsModalVisible(false);
      resetForm();
    } catch {
      setMessage({ type: "error", text: `Failed to ${isEditing ? "update" : "create"} priest` });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setIsEditing(false);
    setSelectedPriest(null);
  };

  // ── PDF export ─────────────────────────────────────────────────────────────

  const handleExportRows = (rows) => {
    if (!rows.length) return;
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["Name", "Hname", "DOB", "Ordination", "Phone", "Email", "Home Type", "Status"]],
      body: rows.map((r) => [
        r.original.name,
        r.original.hname,
        r.original.dob ? new Date(r.original.dob).toLocaleDateString() : "",
        r.original.ordinationDate ? new Date(r.original.ordinationDate).toLocaleDateString() : "",
        r.original.phone || "",
        r.original.email || "",
        r.original.homeType || "",
        r.original.status || "",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [180, 83, 9], textColor: 255 },
      startY: 20,
    });
    doc.text("Priest Management Report", 14, 15);
    doc.save("priests.pdf");
  };

  // ── Table columns ──────────────────────────────────────────────────────────

  const columns = useMemo(() => [
    {
      accessorKey: "name",
      header: "Priest",
      size: 220,
      Cell: ({ row }) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              width: 42, height: 42,
              fontSize: "1rem",
              fontFamily: "'Georgia', serif",
            }}
          >
            {row.original.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: "'Georgia', serif", color: theme.palette.text.primary }}>
              Fr. {row.original.name}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Ord: {row.original.ordinationDate ? new Date(row.original.ordinationDate).toLocaleDateString() : "—"}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      accessorKey: "hname",
      header: "House Name",
      size: 320,
      Cell: ({ row }) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: "'Georgia', serif", color: theme.palette.text.primary }}>
              {row.original.hname}
            </Typography>
           
          </Box>
        </Box>
      ),
    },
    {
      accessorKey: "homeType",
      header: "Home",
      size: 190,
      Cell: ({ row }) => {
        const { homeType, homeParish, homeParishText, homeCongregation } = row.original;
        let label = "—";
        let sub = "";
        if (homeType === "homeDiocese") { label = "Home Diocese"; sub = homeParish?.name || ""; }
        else if (homeType === "otherDiocese") { label = "Other Diocese"; sub = homeParishText || ""; }
        else if (homeType === "congregation") { label = "Congregation"; sub = homeCongregation?.name || ""; }
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ChurchIcon fontSize="small" sx={{ color: theme.palette.primary.light, flexShrink: 0 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
              {sub && <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>{sub}</Typography>}
            </Box>
          </Box>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 150,
      Cell: ({ row }) => {
        const s = statusStyle(row.original.status);
        return (
          <Box>
            <Chip
              label={s.label || row.original.status}
              size="small"
              sx={{ backgroundColor: s.bg, color: s.color, fontWeight: 700, fontSize: "0.72rem", fontFamily: "'Georgia', serif" }}
            />
            {row.original.statusDate && (
              <Typography variant="caption" display="block" sx={{ color: theme.palette.text.secondary, mt: 0.3 }}>
                {new Date(row.original.statusDate).toLocaleDateString()}
              </Typography>
            )}
            {row.original.restHome && (
              <Typography variant="caption" display="block" sx={{ color: theme.palette.text.secondary }}>
                🏠 {row.original.restHome}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Contact",
      size: 160,
      Cell: ({ row }) => (
        <Box>
          <Typography variant="body2">{row.original.phone || "—"}</Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>{row.original.email || ""}</Typography>
        </Box>
      ),
    },
    {
      accessorKey: "dob",
      header: "DOB",
      size: 120,
      Cell: ({ row }) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CalendarIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          <Typography variant="body2">
            {row.original.dob ? new Date(row.original.dob).toLocaleDateString() : "—"}
          </Typography>
        </Box>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      size: 100,
      Cell: ({ row }) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleEdit(row.original)}
              sx={{ backgroundColor: theme.palette.primary.light + "20", "&:hover": { backgroundColor: theme.palette.primary.light + "30" } }}>
              <EditIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleDelete(row.original._id)}
              sx={{ backgroundColor: "rgb(254,226,226)", "&:hover": { backgroundColor: "rgb(254,202,202)" } }}>
              <DeleteIcon fontSize="small" sx={{ color: "rgb(220,38,38)" }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ], []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 3, minHeight: "100vh", background: "#FFFBF5" }}>

        {/* ── Header ── */}
        <StyledCard sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: "50%",
                background: "linear-gradient(135deg, #D97706, #B45309)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <PersonIcon sx={{ color: "white", fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: "'Georgia', serif", color: theme.palette.text.primary, mb: 0.3 }}>
                  Priest Management
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Manage clergy records, assignments and status
                </Typography>
              </Box>
            </Box>
            <GradientButton startIcon={<Plus size={18} />} onClick={() => { setIsModalVisible(true); resetForm(); }}>
              Add New Priest
            </GradientButton>
          </Box>
        </StyledCard>

        {/* ── Table ── */}
        <StyledCard>
          <MaterialReactTable
            columns={columns}
            data={priests}
            enableColumnFiltering enableGlobalFilter enableColumnOrdering enablePagination
            enableSorting enableRowSelection enableColumnResizing enableFullScreenToggle
            enableDensityToggle enableHiding positionToolbarAlertBanner="bottom"
            state={{ isLoading }}
            renderTopToolbarCustomActions={({ table }) => (
              <Box sx={{ display: "flex", gap: 2, p: 2 }}>
                <IconButton onClick={fetchPriests} sx={{ backgroundColor: theme.palette.primary.light + "20" }}>
                  <RefreshIcon sx={{ color: theme.palette.primary.main }} />
                </IconButton>
                <Button variant="outlined" onClick={() => handleExportRows(table.getSelectedRowModel().rows)}
                  startIcon={<FileDownloadIcon />} disabled={!table.getSelectedRowModel().rows.length}
                  sx={{ borderRadius: 8, textTransform: "none", fontWeight: 600 }}>
                  Export Selected
                </Button>
              </Box>
            )}
            muiTablePaperProps={{ elevation: 0, sx: { borderRadius: "12px", border: "none", backgroundColor: "white" } }}
            muiTableProps={{ sx: { "& .MuiTableCell-root": { borderBottom: "1px solid #F3F4F6", backgroundColor: "white" } } }}
            initialState={{ density: "comfortable", pagination: { pageSize: 10 } }}
          />
        </StyledCard>

        {/* ── Create / Edit Dialog ── */}
        <Dialog
          open={isModalVisible}
          onClose={() => { setIsModalVisible(false); resetForm(); }}
          maxWidth="md" fullWidth TransitionComponent={Fade}
          PaperProps={{ elevation: 0, sx: { borderRadius: "16px", bgcolor: "#FFFBF5", boxShadow: "0 20px 50px rgba(0,0,0,0.15)" } }}
        >
          <DialogTitle sx={{ p: 3, borderBottom: "1px solid #F5F0E8", background: "linear-gradient(135deg, #FFFBF5 0%, #FEF3C7 100%)" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: "50%",
                background: "linear-gradient(135deg, #D97706, #B45309)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <PersonIcon sx={{ color: "white", fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "'Georgia', serif", color: theme.palette.text.primary }}>
                  {isEditing ? "Edit Priest Details" : "Add New Priest"}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.3 }}>
                  {isEditing ? "Update the priest's information below" : "Fill in the details to register a new priest"}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>

          <form onSubmit={handleFormSubmit}>
            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={2.5}>

                {/* ── Section: Personal Info ── */}
                <Grid item xs={12}>
                  <SectionLabel><PersonIcon sx={{ fontSize: 14 }} /> Personal Information</SectionLabel>
                  <Divider sx={{ mb: 2, borderColor: "#F5F0E8" }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <StyledTextField label="Priest Name" value={formData.name}
                    onChange={(e) => setField("name", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StyledTextField label="House Name" value={formData.hname}
                    onChange={(e) => setField("hname", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StyledTextField label="Phone" value={formData.phone}
                    onChange={(e) => setField("phone", e.target.value)} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StyledTextField label="Date of Birth" type="date" value={formData.dob}
                    onChange={(e) => setField("dob", e.target.value)}
                    InputLabelProps={{ shrink: true }} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StyledTextField label="Email" type="email" value={formData.email}
                    onChange={(e) => setField("email", e.target.value)} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StyledTextField label="Ordination Date" type="date" value={formData.ordinationDate}
                    onChange={(e) => setField("ordinationDate", e.target.value)}
                    InputLabelProps={{ shrink: true }} fullWidth required />
                </Grid>

                {/* ── Section: Home ── */}
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <SectionLabel><ChurchIcon sx={{ fontSize: 14 }} /> Home Assignment</SectionLabel>
                  <Divider sx={{ mb: 2, borderColor: "#F5F0E8" }} />
                </Grid>

                {/* Home type selector */}
                <Grid item xs={12} sm={6}>
                  <StyledTextField select label="Home Type" value={formData.homeType}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        homeType: e.target.value,
                        homeParish: "",
                        homeParishText: "",
                        homeCongregation: "",
                      }));
                    }}
                    fullWidth required
                  >
                    {HOME_TYPES.map((ht) => (
                      <MenuItem key={ht.value} value={ht.value}>{ht.label}</MenuItem>
                    ))}
                  </StyledTextField>
                </Grid>

                {/* Conditional home parish field */}
                {formData.homeType === "homeDiocese" && (
                  <Grid item xs={12} sm={6}>
                    <StyledTextField select label="Home Parish" value={formData.homeParish}
                      onChange={(e) => setField("homeParish", e.target.value)} fullWidth required>
                      {parishes.length === 0
                        ? <MenuItem disabled>No parishes found</MenuItem>
                        : parishes.map((p) => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)
                      }
                    </StyledTextField>
                  </Grid>
                )}

                {formData.homeType === "otherDiocese" && (
                  <Grid item xs={12} sm={6}>
                    <StyledTextField label="Home Parish Name" value={formData.homeParishText}
                      onChange={(e) => setField("homeParishText", e.target.value)}
                      placeholder="Enter home parish name"
                      fullWidth required />
                  </Grid>
                )}

                {formData.homeType === "congregation" && (
                  <Grid item xs={12} sm={6}>
                    <StyledTextField select label="Congregation" value={formData.homeCongregation}
                      onChange={(e) => setField("homeCongregation", e.target.value)} fullWidth required>
                      {congregations.length === 0
                        ? <MenuItem disabled>No congregations found</MenuItem>
                        : congregations.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)
                      }
                    </StyledTextField>
                  </Grid>
                )}

                {/* ── Section: Status ── */}
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <SectionLabel>
                    <CalendarIcon sx={{ fontSize: 14 }} /> Status
                  </SectionLabel>
                  <Divider sx={{ mb: 2, borderColor: "#F5F0E8" }} />
                </Grid>

                <Grid item xs={12} sm={formData.status === "retired" || formData.status === "died" ? 4 : 6}>
                  <StyledTextField select label="Status" value={formData.status}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value,
                        statusDate: "",
                        restHome: "",
                      }));
                    }}
                    fullWidth required
                  >
                    {STATUSES.map((s) => (
                      <MenuItem key={s.value} value={s.value}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: s.color }} />
                          {s.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </StyledTextField>
                </Grid>

                {/* Date of retirement/death */}
                {(formData.status === "retired" || formData.status === "died") && (
                  <Grid item xs={12} sm={4}>
                    <StyledTextField
                      label={formData.status === "retired" ? "Retirement Date" : "Date of Death"}
                      type="date"
                      value={formData.statusDate}
                      onChange={(e) => setField("statusDate", e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth required
                    />
                  </Grid>
                )}

                {/* Rest home — only for retired */}
                {formData.status === "retired" && (
                  <Grid item xs={12} sm={4}>
                    <StyledTextField
                      label="Rest Home"
                      value={formData.restHome}
                      onChange={(e) => setField("restHome", e.target.value)}
                      placeholder="Name of rest home"
                      fullWidth
                    />
                  </Grid>
                )}

              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: "1px solid #F5F0E8", gap: 2 }}>
              <Button variant="outlined" onClick={() => { setIsModalVisible(false); resetForm(); }}
                sx={{ borderRadius: 8, textTransform: "none", fontWeight: 600, borderColor: "#D6D3D1", color: "#78716C" }}>
                Cancel
              </Button>
              <GradientButton type="submit" disabled={isLoading}>
                {isLoading
                  ? <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={18} color="inherit" />
                      <span>Saving...</span>
                    </Box>
                  : isEditing ? "Update Priest" : "Save Priest"
                }
              </GradientButton>
            </DialogActions>
          </form>
        </Dialog>

        {/* ── Snackbar ── */}
        <Snackbar open={Boolean(message)} autoHideDuration={6000} onClose={() => setMessage(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert onClose={() => setMessage(null)} severity={message?.type || "info"} variant="filled"
            sx={{ borderRadius: "8px", backgroundColor: message?.type === "error" ? "#DC2626" : theme.palette.primary.main }}>
            {message?.text}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default Priest;