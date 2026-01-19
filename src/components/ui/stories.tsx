import type { Meta, StoryObj } from '@storybook/react';

// =============================================================================
// BUTTON STORIES
// =============================================================================
import { Button } from './button';

const ButtonMeta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    disabled: { control: 'boolean' },
    asChild: { control: 'boolean' },
  },
};

export const ButtonDefault: StoryObj<typeof Button> = {
  args: { children: 'Button', variant: 'default' },
};

export const ButtonDestructive: StoryObj<typeof Button> = {
  args: { children: 'Delete', variant: 'destructive' },
};

export const ButtonOutline: StoryObj<typeof Button> = {
  args: { children: 'Outline', variant: 'outline' },
};

export const ButtonSecondary: StoryObj<typeof Button> = {
  args: { children: 'Secondary', variant: 'secondary' },
};

export const ButtonGhost: StoryObj<typeof Button> = {
  args: { children: 'Ghost', variant: 'ghost' },
};

export const ButtonLink: StoryObj<typeof Button> = {
  args: { children: 'Link', variant: 'link' },
};

export const ButtonSmall: StoryObj<typeof Button> = {
  args: { children: 'Small', size: 'sm' },
};

export const ButtonLarge: StoryObj<typeof Button> = {
  args: { children: 'Large', size: 'lg' },
};

export const ButtonDisabled: StoryObj<typeof Button> = {
  args: { children: 'Disabled', disabled: true },
};

// =============================================================================
// CARD STORIES
// =============================================================================
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';

const CardMeta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
};

export const CardDefault: StoryObj<typeof Card> = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content with some sample text.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

// =============================================================================
// INPUT STORIES
// =============================================================================
import { Input } from './input';
import { Label } from './label';

const InputMeta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url'],
    },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
};

export const InputDefault: StoryObj<typeof Input> = {
  args: { placeholder: 'Enter text...' },
};

export const InputWithLabel: StoryObj<typeof Input> = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="email@example.com" />
    </div>
  ),
};

export const InputDisabled: StoryObj<typeof Input> = {
  args: { placeholder: 'Disabled', disabled: true },
};

// =============================================================================
// SELECT STORIES
// =============================================================================
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

const SelectMeta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
};

export const SelectDefault: StoryObj<typeof Select> = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};

// =============================================================================
// TABLE STORIES
// =============================================================================
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

const TableMeta: Meta<typeof Table> = {
  title: 'UI/Table',
  component: Table,
  tags: ['autodocs'],
};

export const TableDefault: StoryObj<typeof Table> = {
  render: () => (
    <Table>
      <TableCaption>A list of sample data.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Item 1</TableCell>
          <TableCell>Active</TableCell>
          <TableCell className="text-right">$100.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Item 2</TableCell>
          <TableCell>Pending</TableCell>
          <TableCell className="text-right">$250.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Item 3</TableCell>
          <TableCell>Inactive</TableCell>
          <TableCell className="text-right">$75.00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

// =============================================================================
// DIALOG STORIES
// =============================================================================
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

const DialogMeta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs'],
};

export const DialogDefault: StoryObj<typeof Dialog> = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            This is a dialog description with helpful context.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Dialog content goes here.</p>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// Export all metas for Storybook discovery
export { ButtonMeta, CardMeta, InputMeta, SelectMeta, TableMeta, DialogMeta };
