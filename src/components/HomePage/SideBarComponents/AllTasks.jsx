import { Table, Button, TextInput, Pagination, Modal } from 'flowbite-react';
import { useEffect, useState } from "react";
import UseAxiosPublic from '../../Auth/UseAxiosPublic';
import { FaTag, FaListUl, FaSearch, FaEdit, FaTrash } from 'react-icons/fa';
import Loading from '../Loading';
import { Helmet } from 'react-helmet';
import Swal from 'sweetalert2';

const AllTasks = () => {
    const axiosPublic = UseAxiosPublic();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 5; // Reduce per page for smaller screens

    // State for Update Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [updateEmail, setUpdateEmail] = useState('');
    const [updateName, setUpdateName] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axiosPublic.get('/allUsers');
                setUsers(response.data);
                setLoading(false);
            } catch (err) {
                setError(err);
                setLoading(false);
            }
        };

        fetchData();
    }, [axiosPublic]);

    useEffect(() => {
        if (searchTerm) {
            const results = users.filter(user =>
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setSearchResults(results);
            setCurrentPage(1); // Reset page on search
        } else {
            setSearchResults([]);
        }
    }, [searchTerm, users]);

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const usersToDisplay = searchTerm ? searchResults : users;

    const sortedUsers = [...usersToDisplay].sort((a, b) => {
        if (sortColumn === 'email') {
            return sortDirection === 'asc' ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email);
        } else if (sortColumn === 'name') {
            return sortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        return 0;
    });

    // Pagination logic
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);

    const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

    const onPageChange = (page) => {
        setCurrentPage(page);
    };

    const openModal = (user) => {
        setSelectedUser(user);
        setUpdateEmail(user.email);
        setUpdateName(user.name);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const handleUpdateUser = async () => {
        if (!selectedUser) return;

        try {
            await axiosPublic.patch(`/users/${selectedUser._id}`, {
                email: updateEmail,
                name: updateName,
            });
            // Update the users state to reflect the changes
            const updatedUsers = users.map(user =>
                user._id === selectedUser._id ? { ...user, email: updateEmail, name: updateName } : user
            );
            setUsers(updatedUsers);
            closeModal();
            Swal.fire('Updated!', 'User information has been updated.', 'success');
        } catch (error) {
            console.error('Error updating user:', error);
            Swal.fire('Error!', 'Failed to update user information.', 'error');
        }
    };

    const handleDeleteUser = async (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axiosPublic.delete(`/users/${id}`);
                    // Remove the deleted user from the users state
                    const remainingUsers = users.filter(user => user._id !== id);
                    setUsers(remainingUsers);
                    // Optionally, recalculate total pages if the last item on the page was deleted
                    if (remainingUsers.length % usersPerPage === 0 && currentPage > 1) {
                        setCurrentPage(currentPage - 1);
                    }
                    Swal.fire(
                        'Deleted!',
                        'User has been deleted.',
                        'success'
                    );
                } catch (error) {
                    console.error('Error deleting user:', error);
                    Swal.fire(
                        'Error!',
                        'Failed to delete the user.',
                        'error'
                    );
                }
            }
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen ">
                <Loading />
            </div>
        );
    }

    if (error) {
        return <p>Error fetching users: {error.message}</p>;
    }

    return (
        <div>
            <Helmet>
                <title>React Tasks || Home-Details</title>
            </Helmet>
            <div className="flex flex-col mt-2">
                <h1 className='text-xl md:text-2xl flex justify-center mx-auto text-center font-bold mb-2'>All Users</h1>
                <hr className="mb-2" />
                <div className="mb-2 mt-2 flex flex-col sm:flex-row justify-between items-center w-full mx-auto px-2 sm:px-0">
                    <div className="flex flex-wrap gap-2 mb-2 sm:mb-0">
                        {/* Sorting Buttons */}
                        <Button size="sm" onClick={() => handleSort('email')} color="gray">
                            <div className="flex items-center">
                                <FaTag className="mr-1" />
                                <span className="hidden sm:inline">Email</span>
                                {sortColumn === 'email' && (sortDirection === 'asc' ? '▲' : '▼')}
                            </div>
                        </Button>
                        <Button size="sm" onClick={() => handleSort('name')} color="gray">
                            <div className="flex items-center">
                                <FaListUl className="mr-1" />
                                <span className="hidden sm:inline">Name</span>
                                {sortColumn === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
                            </div>
                        </Button>
                    </div>
                    {/* Search Input */}
                    <TextInput
                        size="sm"
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={FaSearch}
                        className="w-full sm:w-auto"
                    />
                </div>
                <div className="overflow-x-auto">
                    <Table hoverable={true}>
                        <Table.Head className="sticky top-0 bg-gray-100 dark:bg-gray-700">
                            <Table.HeadCell>User Email</Table.HeadCell>
                            <Table.HeadCell>Name</Table.HeadCell>
                            <Table.HeadCell>Actions</Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y">
                            {currentUsers.map(user => (
                                <Table.Row key={user._id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                        {user.email}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {user.name}
                                    </Table.Cell>
                                    <Table.Cell className="flex flex-col sm:flex-row gap-2">
                                        <Button size="xs" color="warning" onClick={() => openModal(user)}>
                                            <FaEdit className="mr-1" />
                                            <span className="hidden sm:inline">Update</span>
                                        </Button>
                                        <Button size="xs" color="failure" onClick={() => handleDeleteUser(user._id)}>
                                            <FaTrash className="mr-1" />
                                            <span className="hidden sm:inline">Delete</span>
                                        </Button>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </div>
                {/* Pagination component */}
                {sortedUsers.length > usersPerPage && (
                    <div className="flex justify-center mt-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={onPageChange}
                            layout="pagination" // Adjust layout if needed
                        />
                    </div>
                )}
            </div>

            {/* Update Modal */}
            <Modal show={isModalOpen} onClose={closeModal}>
                <Modal.Header>Update User</Modal.Header>
                <Modal.Body>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                            <TextInput
                                id="email"
                                type="email"
                                value={updateEmail}
                                onChange={(e) => setUpdateEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Name</label>
                            <TextInput
                                id="name"
                                type="text"
                                value={updateName}
                                onChange={(e) => setUpdateName(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={handleUpdateUser}>Update</Button>
                    <Button color="gray" onClick={closeModal}>
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};
export default AllTasks;