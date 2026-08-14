import { CallHistory } from '../models/CallHistory.js';

export const getCallHistory = async (req, res) => {
    try {
        // console.log(`🔍 Fetching call history for user: ${req.user._id}`);
        const history = await CallHistory.find({
            $or: [{ caller: req.user._id }, { receiver: req.user._id }]
        })
        .populate('caller', 'name profileImage')
        .populate('receiver', 'name profileImage')
        .sort({ createdAt: -1 });
 
        // console.log(`✅ Found ${history.length} call records`);
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createCallRecord = async (data) => {
    try {
        const call = await CallHistory.create(data);
        return call;
    } catch (error) {
        console.error('Error creating call record:', error);
    }
};

export const updateCallRecord = async (id, data) => {
    try {
        const call = await CallHistory.findByIdAndUpdate(id, data, { new: true });
        return call;
    } catch (error) {
        console.error('Error updating call record:', error);
    }
};
