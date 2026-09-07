import mongoose from 'mongoose';

const TemplateItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  defaultAssigneeRole: {
    type: String,
    default: '',
  },
  guidelines: {
    type: String,
    default: '',
  }
});

const TemplateSectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  items: [TemplateItemSchema],
});

const TemplateSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    isBuiltin: {
      type: Boolean,
      default: false,
    },
    estimatedHours: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    sections: [TemplateSectionSchema],
  },
  {
    timestamps: true,
  }
);

export const Template = mongoose.model('Template', TemplateSchema);
