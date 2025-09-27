import mongoose, { Document, Schema } from 'mongoose';

export interface IEpisode extends Document {
  podcast: mongoose.Schema.Types.ObjectId;
  title: string;
  summary: string;
  script: string;
  audioUrl: string;
  owner: string; // wallet address
}

const EpisodeSchema: Schema = new Schema({
  podcast: { type: Schema.Types.ObjectId, ref: 'Podcast', required: true },
  title: { type: String, required: true },
  summary: { type: String, required: true },
  script: { type: String, required: true },
  audioUrl: { type: String, required: true },
  owner: { type: String, required: true }, // wallet address
}, { timestamps: true });

export const Episode = mongoose.models.Episode || mongoose.model<IEpisode>('Episode', EpisodeSchema);
