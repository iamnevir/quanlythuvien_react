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
const TuSachPage = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  function flattenJson(jsonData) {
    const flattenedData = {};

    function flattenObject(obj, prefix = "") {
      for (let key in obj) {
        if (typeof obj[key] === "object" && obj[key] !== null) {
          flattenObject(obj[key], `${prefix}${key}.`);
        } else {
          flattenedData[`${prefix}${key}`] = obj[key];
        }
      }
    }

    flattenObject(jsonData);
    return flattenedData;
  }
  const getUser = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("http://localhost:8080/api/v1/book");
      setTableData(res.data.data);

      console.log(res.data.data);
      setIsLoading(false);
    } catch (error) {}
  };
  const handleCreateNewRow = async (values) => {
    try {
      await axios.post("http://localhost:8080/api/v1/", {
        name: values.name,
        phone: values.phone,
        state: 1,
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
        await axios.put("http://localhost:8080/api/v1/" + values.id, {
          name: values.name,
          phone: values.phone,
          state: 1,
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
        "http://localhost:8080/api/v1/book/" + row.getValue("id")
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
            cell.column.id === "name"
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
        accessorKey: "tusach",
        header: "Tủ sách",

        size: 255,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
        GroupedCell: ({ cell, row }) => (
          <Box sx={{ color: "primary.main" }}>
            <strong>{cell.getValue()}s </strong> ({row.subRows?.length})
          </Box>
        ),
      },
      {
        header: "Đầu sách",
        accessorKey: "dausach",
        //optionally, customize the cell render when this column is grouped. Make the text blue and pluralize the word
        GroupedCell: ({ cell, row }) => (
          <Box sx={{ color: "primary.main" }}>
            <strong>{cell.getValue()}s </strong> ({row.subRows?.length})
          </Box>
        ),
      },
      {
        accessorKey: "ten",
        header: "Sách",
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: "trangthai",
        header: "Trạng thái",
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
    ],
    [getCommonEditTextFieldProps]
  );
  return (
    <>
      <div className="bg-slate-900 px-4 rounded-es-xl py-4 border-2 border-slate-900">
        <MaterialReactTable
          enableGrouping
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
              Tạo tủ sách mới
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
      <DialogTitle textAlign="center">Tạo tủ sách mới</DialogTitle>
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
          Tạo tủ sách mới
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const validateRequired = (value) => !!value.length;

export default TuSachPage;
