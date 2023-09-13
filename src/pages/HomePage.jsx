import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MaterialReactTable } from "material-react-table";

import axios from "axios";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
const HomePage = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const getUser = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(
        "http://localhost:8080/api/v1/hoadon?page=1&limit=10"
      );
      setTableData(res.data.data.data);

      console.log(res.data.data.data);
      setIsLoading(false);
    } catch (error) {}
  };
  const handleCreateNewRow = async (values) => {
    try {
      const currentTime = new Date();
      const formattedTime = `${currentTime.getFullYear()}-${(
        currentTime.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${currentTime
        .getDate()
        .toString()
        .padStart(2, "0")} ${currentTime
        .getHours()
        .toString()
        .padStart(2, "0")}:${currentTime
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${currentTime
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;
      console.log(values.ngaymuon + values.trangthai);
      await axios.post("http://localhost:8080/api/v1/hoadon", {
        nguoimuon: values.nguoimuon,
        sach: values.sach,
        ngaymuon: values.ngaymuon == "" ? formattedTime : values.ngaymuon,
        ngaytra: values.ngaytra,
        trangthai: values.trangthai == "" ? 0 : values.trangthai,
      });
      getUser();
    } catch (error) {}
  };
  useEffect(() => {
    getUser();
  }, []);
  const handleSaveRowEdits = async ({ exitEditingMode, row, values }) => {
    if (!Object.keys(validationErrors).length) {
      try {
        await axios.put("http://localhost:8080/api/v1/hoadon/" + values.id, {
          nguoimuon: values.name,
          sach: values.phone,
          ngaymuon: values.ngaymuon,
          ngaytra: values.ngaytra,
          trangthai: values.trangthai,
        });
      } catch (error) {}

      exitEditingMode();
      getUser(); //required to exit editing mode and close modal
    }
  };

  const handleCancelRowEdits = () => {
    setValidationErrors({});
  };

  const handleDeleteRow = useCallback(async (row) => {
    if (!confirm(`Are you sure you want to delete ${row.getValue("name")}`)) {
      return;
    }
    //send api delete request here, then refetch or update local table data for re-render
    try {
      await axios.delete(
        "http://localhost:8080/api/v1/hoadon/" + row.getValue("id")
      );
      getUser();
    } catch (error) {}
  });

  const getCommonEditTextFieldProps = useCallback(
    (cell) => {
      return {
        error: !!validationErrors[cell.id],
        helperText: validationErrors[cell.id],
        onBlur: (event) => {
          const isValid =
            cell.column.id === "nguoimuon" || cell.column.id === "sach"
              ? validateRequired(event.target.value)
              : true;
          if (!isValid) {
            //set validation error for cell if invalid
            setValidationErrors({
              ...validationErrors,
              [cell.id]: `${cell.column.columnDef.header} is required`,
            });
          } else {
            //remove validation error for cell if valid
            delete validationErrors[cell.id];
            setValidationErrors({
              ...validationErrors,
            });
          }
        },
      };
    },
    [validationErrors]
  );
  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        enableColumnOrdering: false,
        enableEditing: false, //disable editing on this column
        enableSorting: false,
        size: 11,
      },
      {
        accessorKey: "nguoimuon",
        header: "Người mượn",
        size: 255,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: "sach",
        header: "ID Sách",
        size: 20,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: "ngaymuon",
        header: "Ngày mượn",
        size: 20,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: "ngaytra",
        header: "Ngày trả",
        size: 20,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: "trangthai",
        header: "Trạng thái",
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
          type: "number",
        }),
      },
    ],
    [getCommonEditTextFieldProps]
  );
  return (
    <>
      <div className="bg-slate-900 px-4 rounded-es-xl py-4 border-2 border-slate-900">
        <MaterialReactTable
          displayColumnDefOptions={{
            "mrt-row-actions": {
              muiTableHeadCellProps: {
                align: "center",
              },
              size: 120,
            },
          }}
          columns={columns}
          data={tableData}
          editingMode="modal" //default
          enableColumnOrdering
          enableEditing
          onEditingRowSave={handleSaveRowEdits}
          onEditingRowCancel={handleCancelRowEdits}
          renderRowActions={({ row, table }) => (
            <Box sx={{ display: "flex", gap: "1rem" }}>
              <Tooltip arrow placement="left" title="Sửa">
                <IconButton onClick={() => table.setEditingRow(row)}>
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip arrow placement="left" title="Xóa">
                <IconButton color="error" onClick={() => handleDeleteRow(row)}>
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          renderTopToolbarCustomActions={() => (
            <Button
              color="secondary"
              onClick={() => setCreateModalOpen(true)}
              variant="contained"
            >
              Thêm hóa đơn mượn
            </Button>
          )}
        />
        <CreateNewAccountModal
          columns={columns}
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateNewRow}
        />
      </div>
    </>
  );
};

//UserPage of creating a mui dialog modal for creating new rows
export const CreateNewAccountModal = ({ open, columns, onClose, onSubmit }) => {
  const [values, setValues] = useState(() =>
    columns.reduce((acc, column) => {
      acc[column.accessorKey ?? ""] = "";
      return acc;
    }, {})
  );

  const handleSubmit = () => {
    //put your validation logic here
    onSubmit(values);
    onClose();
  };

  return (
    <Dialog open={open}>
      <DialogTitle textAlign="center">Thêm</DialogTitle>
      <DialogContent>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack
            sx={{
              width: "100%",
              minWidth: { xs: "300px", sm: "360px", md: "400px" },
              gap: "1.5rem",
            }}
          >
            {columns.map((column) => (
              <TextField
                key={column.accessorKey}
                label={column.header}
                name={column.accessorKey}
                onChange={(e) =>
                  setValues({ ...values, [e.target.name]: e.target.value })
                }
              />
            ))}
          </Stack>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: "1.25rem" }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="secondary" onClick={handleSubmit} variant="contained">
          Thêm Hóa đơn
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const validateRequired = (value) => !!value.length;

export default HomePage;
