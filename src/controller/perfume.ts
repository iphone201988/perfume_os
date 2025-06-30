import { NextFunction, Request, Response } from "express";
import PerfumeModel from "../model/Perfume";
import { SUCCESS } from "../utils/response";
import { BadRequestError } from "../utils/errors";
import ReviewModel from "../model/Reviews";
import NotesModel from "../model/Notes";
import { escapeRegex } from "../utils/utills";



// get perfume
const perfume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, brand, perfumeId } = req.query;

        let query: Record<string, any> = {};

        // Build the query with escaped regex if necessary
        if (typeof name === 'string') query['name'] = new RegExp(escapeRegex(name), 'i');
        if (typeof brand === 'string') query['brand'] = new RegExp(escapeRegex(brand), 'i');
        if (typeof perfumeId === 'string') query['_id'] = perfumeId;

        // Fetch the perfume and reviews in a single query (including notes data)
        const perfume: any = await PerfumeModel.findOne(query).lean();

        if (!perfume) {
            return next(new BadRequestError("Perfume not found"));
        }

        // Populate note information by fetching all notes at once
        const noteGroups = ['base', 'top', 'middle', 'notes'];
        for (const group of noteGroups) {
            if (perfume?.notes?.[group]?.length) {
                const noteIds = perfume.notes[group].map((item: any) => item?.noteId).filter(Boolean);
                if (noteIds.length) {
                    const notes = await NotesModel.find({ '_id': { $in: noteIds } }).lean();
                    perfume.notes[group] = perfume.notes[group].map((item: any) => ({
                        ...item,
                        noteId: notes.find((note: any) => note._id.toString() === item?.noteId?.toString()) || item.noteId
                    }));
                }
            }
        }
        perfume.reviews = await ReviewModel.find({ perfumeId: perfume._id }).lean();
        // same brand perfumes
        perfume.sameBrand = await PerfumeModel.find({ brand: perfume.brand })
            .select('name brand image')
            .limit(5)
            .lean();
        // similar perfume
        const similarPerfumes = await PerfumeModel.find({
            "mainAccords.name": { $in: perfume.mainAccords.map((accord: any) => accord.name) },
            _id: { $ne: perfume._id } // exclude the current perfume
        }).select('name brand image')
            .limit(5)
            .lean();

        // Add the similar perfumes to the response
        perfume.similar = similarPerfumes;
        SUCCESS(res, 200, "Perfume fetched successfully", { perfume });
    } catch (error) {
        next(error);
    }
};

//search perfume
const searchPerfume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name } = req.query;
        const perfume = await PerfumeModel.find({ name: { $regex: name, $options: 'i' } }).lean();
        SUCCESS(res, 200, "Perfume fetched successfully", { perfume });
    } catch (error) {
        next(error);
    }
}

// async function lalala() {
//     const notesList = await NotesModel.find({}).lean();
//     const noteMap = new Map(notesList.map(note => [note.name.toLowerCase().trim(), note._id]));

//     const perfumes = await PerfumeModel.find({}).lean();
//     let count = 0;

//     for (const perfume of perfumes) {
//         count++;
//         console.log(perfume?.name, "COUNT", count);

//         const noteGroups = ['base', 'top', 'middle', 'notes'];
//         let updated = false;

//         for (const group of noteGroups) {
//             if (perfume?.notes?.[group]?.length > 0) {
//                 for (let i = 0; i < perfume.notes[group].length; i++) {
//                     const item = perfume.notes[group][i];
//                     const noteId = noteMap.get(item.name.toLowerCase().trim());

//                     if (noteId) {
//                         perfume.notes[group][i].noteId = noteId;
//                         updated = true;
//                     }else{
//                         // with regex 
//                         const note = await NotesModel.findOne({ name: { $regex: item.name, $options: 'i' } }).lean();
//                         if (note) {
//                             perfume.notes[group][i].noteId = note._id;
//                             updated = true;
//                         }

//                     }
//                 }
//             }
//         }

//         if (updated) {
//             // console.log("perfume.notes", perfume.notes);
//             await PerfumeModel.updateOne(
//                 { _id: perfume._id },
//                 { $set: { notes: perfume.notes } }
//             );
//         }
//     }
// }

// lalala();

// async function trimSpace() {
//     const perfumes = await PerfumeModel.find({
//         intendedFor: { $exists: true, $ne: [] }
//     }).lean();

//     const bulkOps = [];

//     for (const perfume of perfumes) {
//         const original = perfume.intendedFor;
//         const trimmed = original.map((item: any) => item.trim());

//         // Only push update if there's a difference
//         if (JSON.stringify(original) !== JSON.stringify(trimmed)) {
//             bulkOps.push({
//                 updateOne: {
//                     filter: { _id: perfume._id },
//                     update: { $set: { intendedFor: trimmed } }
//                 }
//             });
//         }
//     }

//     if (bulkOps.length > 0) {
//         const result = await PerfumeModel.bulkWrite(bulkOps);
//         console.log(`Updated ${result.modifiedCount} perfumes.`);
//     } else {
//         console.log("No updates needed.");
//     }
// }
// trimSpace();
export default { perfume };