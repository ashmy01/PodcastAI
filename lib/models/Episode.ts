import mongoose, { Document, Schema } from 'mongoose';

export interface IEpisode extends Document {
  podcast: mongoose.Schema.Types.ObjectId;
  title: string;
  summary: string;
  script: string;
  audioUrl: string;
  owner: string; // wallet address
  
  // AI advertising fields
  hasAds: boolean;
  adCount: number;
  totalViews: number;
  totalEarnings: number;
  adPlacements: mongoose.Schema.Types.ObjectId[];
}

const EpisodeSchema: Schema = new Schema({
  podcast: { type: Schema.Types.ObjectId, ref: 'Podcast', required: true },
  title: { type: String, required: true },
  summary: { type: String, required: true },
  script: { type: String, required: true },
  audioUrl: { type: String, required: true },
  owner: { type: String, required: true }, // wallet address
  
  // AI advertising fields
  hasAds: {
    type: Boolean,
    default: false
  },
  adCount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalViews: {
    type: Number,
    default: 0,
    min: 0
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  adPlacements: [{
    type: Schema.Types.ObjectId,
    ref: 'AdPlacement'
  }]
}, { timestamps: true });

// Indexes for performance
EpisodeSchema.index({ podcast: 1, createdAt: -1 });
EpisodeSchema.index({ owner: 1, hasAds: 1 });
EpisodeSchema.index({ hasAds: 1, totalViews: -1 });

// Virtual for earnings per view
EpisodeSchema.virtual('earningsPerView').get(function() {
  return this.totalViews > 0 ? this.totalEarnings / this.totalViews : 0;
});

// Methods
EpisodeSchema.methods.addView = function() {
  this.totalViews += 1;
  return this.save();
};

EpisodeSchema.methods.addEarnings = function(amount: number) {
  this.totalEarnings += amount;
  return this.save();
};

EpisodeSchema.methods.hasVerifiedAds = async function() {
  if (!this.hasAds) return false;
  
  const AdPlacement = mongoose.model('AdPlacement');
  const verifiedCount = await AdPlacement.countDocuments({
    episodeId: this._id.toString(),
    status: 'verified'
  });
  
  return verifiedCount > 0;
};

export const Episode = mongoose.models.Episode || mongoose.model<IEpisode>('Episode', EpisodeSchema);
