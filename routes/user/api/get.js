import express from 'express';
import User from '../../../models/user.js';

const userList = express.Router();


userList.post('', async (req, res) => {
    try {
        const query = req.body || {}
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const users = await User.find({}).sort({ _id: -1 });

        const result = {
            tableHeader:[
                { name: "name", displayName: "Name" },
                { name: "mobile", displayName: "Mobile" },
                { name: "email", displayName: "Email" },
                { name: "dob", displayName: "DOB" },
                {name:"role",displayName:"Role"},
                

            ],
          
            components: [
                { name: "name", displayName: "Name", component: "profile" },
                { name: "mobile", displayName: "Mobile", component: "text" },
                { name: "email", displayName: "Email", component: "text" },
                { name: "dob", displayName: "DOB", component: "date" },
                {name:"role",displayName:"Role",component:"textBox"},
               
            ],
            data: []
        };

        if (users && users.length > 0) {
            const totalUsers = users.length;
            const paginatedUsers = users.slice(skip, skip + limit);

            paginatedUsers.forEach((user) => {
                const row = {};
                row.id = user._id;
                row.name = user.name;
                row.mobile = user.mobile;
                row.email = user.email;
                row.dob = user.dob;
                row.role = user.isSeller ? "Seller" : "Customer";
               
                result.data.push(row);
            });

            result.totalPages = Math.ceil(totalUsers / limit);
        }
        res.status(200).send({ result });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Internal server error",
        });
    }

})

export default userList