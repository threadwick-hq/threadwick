// Studio icon aliases, backed by the action-named @threadwick/icons set (Font Awesome).
// Transitional: the 6c chrome rebuild (AntD -> shadcn, TW-014/015) calls <Icon name> directly
// and retires these glyph-named aliases. Decorative by default (chrome buttons own the label).
import { Icon, type IconName } from '@threadwick/icons';

type IconAliasProps = { className?: string };

function alias(name: IconName) {
  return function IconAlias({ className }: IconAliasProps = {}) {
    return <Icon name={name} label="" className={className} />;
  };
}

export const PlusIcon = alias('add');
export const SelectModeIcon = alias('select-mode');
export const InsertModeIcon = alias('insert-mode');
export const PanModeIcon = alias('pan-mode');
export const ImportIcon = alias('import');
export const DownloadIcon = alias('download');
export const CopyIcon = alias('copy');
export const DeleteIcon = alias('delete');
export const MoreIcon = alias('more');
export const BackIcon = alias('previous');
export const ChevronDownIcon = alias('chevron-down');
export const PdfIcon = alias('pdf');
export const UndoIcon = alias('undo');
export const RedoIcon = alias('redo');
export const HelpIcon = alias('help');
export const ZoomInIcon = alias('zoom-in');
export const ZoomOutIcon = alias('zoom-out');
export const FitIcon = alias('fit');
export const EditIcon = alias('edit');
export const RotateRightIcon = alias('rotate-stitch-right'); // counter-clockwise = .icon-flip-h
export const MirrorIcon = alias('mirror-stitch');
export const OriginIcon = alias('set-origin');
export const MenuIcon = alias('open-menu');
export const YarnIcon = alias('yarn');
export const LinkIcon = alias('link');
export const NotesIcon = alias('notes');
export const VariationIcon = alias('variation');
export const SignInIcon = alias('sign-in');
export const SignOutIcon = alias('sign-out');
export const AccountIcon = alias('account');
export const PasskeyIcon = alias('fingerprint');
export const GoogleIcon = alias('google');
export const MailIcon = alias('mail');
