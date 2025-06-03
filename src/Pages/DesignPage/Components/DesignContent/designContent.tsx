import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Box, Typography, Card, CardContent, CardMedia, Grid, IconButton, Drawer, Select, MenuItem, InputLabel, FormControl, Slider, Checkbox, FormControlLabel, Tooltip, Divider, Menu, useMediaQuery } from '@mui/material';
import { ThemeProvider, createTheme, styled, useTheme, alpha } from '@mui/material/styles'; // Added ThemeProvider, createTheme
import {
    TextFields as TextFieldsIcon,
    Delete as DeleteIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    FlipToFront as FlipToFrontIcon,
    FlipToBack as FlipToBackIcon,
    Opacity as OpacityIcon,
    CloudUpload as CloudUploadIcon,
    PhotoLibrary as PhotoLibraryIcon,
    Image as ImageIcon,
    FilterVintage as FilterVintageIcon,
    CropFree as CropFreeIcon,
    Save as SaveIcon,
    Print as PrintIcon,
    Download as DownloadIcon,
    ArrowBack as ArrowBackIcon,
    DesignServices as DesignServicesIcon,
    Style as StyleIcon,
    Category as CategoryIcon,
    Label as LabelIcon,
    PeopleAlt as PeopleAltIcon,
    FileCopy as FileCopyIcon,
    AddCircleOutline as AddCircleOutlineIcon,
    Menu as MenuIcon,
    MoreVert as MoreVertIcon,
    Settings as SettingsIcon,
} from '@mui/icons-material';
import JSZip from 'jszip';

// Interfaces for design items
interface TextItem {
    id: string;
    content: string;
    x: number;
    y: number;
    fontFamily: string;
    fontSize: number;
    color: string;
    isEditing: boolean;
    type: 'text';
    rotation: number;
    width?: number;
    height?: number;
    opacity: number;
    zIndex: number;
}

interface ImageItem {
    id: string;
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    type: 'image';
    opacity: number;
    zIndex: number;
}

type DesignItem = TextItem | ImageItem;

// Interface for uploaded images by the user
interface UserUploadedImage {
    id: string;
    name: string;
    url: string;
}

// Interface for a Template
interface Template {
    id: string;
    name: string;
    imageUrl: string | null;
    width: number;
    height: number;
}

// Interface for a Page
interface Page {
    id: string;
    name: string;
    items: DesignItem[];
    backgroundImage: string | null;
    canvasWidth: number;
    canvasHeight: number;
    templateId?: string;
}


// Constants
const FONT_FAMILIES = ['Arial', 'Times New Roman', 'Verdana', 'Courier New', 'Garamond', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald'];

const TEMPLATES: Template[] = [
    { id: 'template1_local', name: 'Mẫu Cục Bộ 1 (800x600)', imageUrl: '/tp800x600.png', width: 800, height: 600 },
    { id: 'template2_local', name: 'Mẫu Cục Bộ 2 (600x800)', imageUrl: '/tp600x800.png', width: 600, height: 800 },
    { id: 'template3_local', name: 'Mẫu Cục Bộ 3 (700x500)', imageUrl: '/tp700x500.png', width: 700, height: 500 },
];

const ICON_IMAGES = [
    { id: 'icon1_local', name: 'Icon Cục Bộ 1', url: '/ic1.png' },
    { id: 'icon2_local', name: 'Icon Cục Bộ 2', url: '/ic2.png' },
    { id: 'icon3_local', name: 'Icon Cục Bộ 3', url: '/ic3.png' },
];

const COMPONENT_IMAGES = [
    { id: 'comp1_local', name: 'Thành Phần Cục Bộ 1', url: '/comp1.png' },
    { id: 'comp2_local', name: 'Thành Phần Cục Bộ 2', url: '/comp2.png' },
];

const TAG_IMAGES = [
    { id: 'tag1_local', name: 'Tag Cục Bộ 1', url: '/tag1.png' },
    { id: 'tag2_local', name: 'Tag Cục Bộ 2', url: '/tag2.png' },
];


const MIN_ITEM_WIDTH = 20;
const MIN_ITEM_HEIGHT = 20;
const HANDLE_SIZE = 12; 
const HANDLE_OFFSET = HANDLE_SIZE / 2;
const BASE_Z_INDEX = 5;

const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3.0;

const LEFT_SIDEBAR_WIDTH_DESKTOP = 220;
const RIGHT_SIDEBAR_WIDTH_DESKTOP = 280;
const MOBILE_DRAWER_WIDTH = '85vw'; 

const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;

// Styled components
const Input = styled(TextField)({ '& input[type=number]': { width: '100px' } }); 
const CanvasWrapper = styled(Box)({ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', boxSizing: 'border-box', overflow: 'auto', touchAction: 'none' });
const CanvasContainer = styled(Box)({ position: 'relative', border: '1px solid #ccc', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' });
const StyledCanvas = styled('canvas')({ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' });
const DraggableItem = styled(motion.div)({ position: 'absolute', cursor: 'grab', '&:active': { cursor: 'grabbing' }, boxSizing: 'border-box' });

const HandleStyles: React.CSSProperties = { position: 'absolute', width: `${HANDLE_SIZE}px`, height: `${HANDLE_SIZE}px`, borderRadius: '50%', border: '1.5px solid white', boxShadow: '0 0 5px rgba(0,0,0,0.3)', zIndex: 20000, boxSizing: 'border-box', cursor: 'default' };
const ResizeHandleStyle: React.CSSProperties = { ...HandleStyles, backgroundColor: '#000000', cursor: 'nwse-resize' }; // Changed to black
const RotateHandleStyle: React.CSSProperties = { ...HandleStyles, backgroundColor: '#000000', cursor: 'alias', top: `-${HANDLE_OFFSET + 10}px`, left: `calc(50% - ${HANDLE_OFFSET}px)` }; // Changed to black

// Custom theme to change primary color to black
const editorTheme = createTheme({
    palette: {
        primary: {
            main: '#000000', // Black
            contrastText: '#ffffff',
        },
        secondary: { // Also making secondary black for consistency, or choose another dark color
            main: '#333333', // Dark grey, or '#000000' for pure black
            contrastText: '#ffffff',
        },
    },
    typography: {
        fontFamily: 'Inter, sans-serif', // Ensuring Inter font is applied via theme
         button: {
            textTransform: 'none' // Optional: prevent uppercase buttons if desired
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                // Example: ensure outlined primary buttons also use black
                outlinedPrimary: {
                    borderColor: '#000000',
                    color: '#000000',
                    '&:hover': {
                        borderColor: alpha('#000000', 0.7),
                        backgroundColor: alpha('#000000', 0.04),
                    }
                }
            }
        },
        MuiSlider : {
            styleOverrides: {
                root: {
                    // color: '#000000', // This will make the slider track black if it uses primary color
                }
            }
        }
    }
});


// Template Picker Component
const TemplatePicker = ({ templates, onSelectTemplate }: { templates: Template[], onSelectTemplate: (templateId: string) => void }) => (
    <Box sx={{ mt: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ px: 1 }}>Chọn mẫu thiệp</Typography>
        <Grid container spacing={1.5} sx={{ px: 1 }}>
            {templates.map(template => (
                <Grid item key={template.id} xs={12} >
                    <Card onClick={() => onSelectTemplate(template.id)} sx={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'scale(1.02)', boxShadow: 3 } }}>
                        {template.imageUrl && (
                            <CardMedia component="img" height="100" image={template.imageUrl} alt={template.name} sx={{ objectFit: 'cover' }}
                                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                    const target = e.target as HTMLImageElement; target.onerror = null;
                                    target.src = `https://placehold.co/${template.width || 200}x${template.height || 100}/E0E0E0/FFFFFF?text=Lỗi+Mẫu`;
                                }} />
                        )}
                        <CardContent sx={{ p: 1 }}><Typography variant="caption" component="div">{template.name} ({template.width}x{template.height})</Typography></CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    </Box>
);

// Generic Image Picker Component
const GenericImagePicker = ({ images, onSelectImage, title }: { images: { id: string, name: string, url: string }[], onSelectImage: (imageUrl: string) => void, title: string }) => (
    <Box sx={{ mt: 1 }}>
        <Typography variant="h6" gutterBottom sx={{px:1}}>{title}</Typography>
        <Grid container spacing={1.5} sx={{px:1}}>
            {images.map(image => (
                <Grid item key={image.id} xs={6} sm={4}>
                    <Card onClick={() => onSelectImage(image.url)} sx={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'scale(1.02)', boxShadow: 3 } }}>
                        <CardMedia component="img" height="80" image={image.url} alt={image.name} sx={{ objectFit: 'contain', p:0.5 }}
                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                const target = e.target as HTMLImageElement; target.onerror = null;
                                target.src = `https://placehold.co/80x80/E0E0E0/FFFFFF?text=Lỗi`;
                            }} />
                        <CardContent sx={{ p: 0.5, textAlign:'center' }}><Typography variant="caption" noWrap component="div">{image.name}</Typography></CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    </Box>
);

// User Uploaded Image Picker Component
const UserImageManager = ({ userImages, onSelectUserImage, onImageUploaded }: { userImages: UserUploadedImage[]; onSelectUserImage: (imageUrl: string) => void; onImageUploaded: (file: File) => void; }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleUploadButtonClick = () => fileInputRef.current?.click();
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) onImageUploaded(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <Box sx={{px:1}}>
            <Typography variant="h6" gutterBottom>Ảnh của bạn</Typography>
            <Button variant="contained" onClick={handleUploadButtonClick} startIcon={<CloudUploadIcon />} sx={{ mb: 2, width: '100%' }} size="medium">Tải ảnh lên</Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
            {userImages.length === 0 && (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 2 }}>Bạn chưa tải ảnh nào lên.</Typography>
            )}
            <Grid container spacing={1} sx={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
                {userImages.map((img) => (
                    <Grid item key={img.id} xs={6} sm={4}>
                        <Card onClick={() => onSelectUserImage(img.url)} sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3, transform: 'scale(1.03)' }, transition: 'transform 0.1s, box-shadow 0.1s' }}>
                            <CardMedia component="img" height="80" image={img.url} alt={img.name} sx={{ objectFit: 'contain', p: 0.5 }}
                                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                    const target = e.target as HTMLImageElement; target.onerror = null;
                                    target.src = `https://placehold.co/80x80/EAEAEA/999999?text=Lỗi`;
                                }} />
                            <CardContent sx={{ p: 0.5, textAlign: 'center' }}><Typography variant="caption" noWrap display="block">{img.name}</Typography></CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};


// Text Editor Component (on canvas)
const TextEditor = ({ item, onUpdateText, canvasWidth, canvasHeight, isSelected, onSelectItem, canvasRef, zoomLevel }: { item: TextItem, onUpdateText: (id: string, updates: Partial<TextItem>) => void, canvasWidth: number, canvasHeight: number, isSelected: boolean, onSelectItem: (id: string) => void, canvasRef: React.RefObject<HTMLDivElement | null>, zoomLevel: number }) => {
    const inputRef = useRef<HTMLTextAreaElement>(null); 
    const itemRef = useRef<HTMLDivElement>(null);
    useEffect(() => { if (item.isEditing && inputRef.current) inputRef.current.focus(); }, [item.isEditing]);
    const handleBlur = () => onUpdateText(item.id, { isEditing: false });
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleBlur(); }};
    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        let newX = item.x + info.offset.x / zoomLevel;
        let newY = item.y + info.offset.y / zoomLevel;
        const currentItemElement = itemRef.current;
        if (currentItemElement) {
            const currentItemWidth = currentItemElement.offsetWidth / zoomLevel; 
            const currentItemHeight = currentItemElement.offsetHeight / zoomLevel; 
            newX = Math.max(0, Math.min(newX, canvasWidth - currentItemWidth));
            newY = Math.max(0, Math.min(newY, canvasHeight - currentItemHeight));
        }
        onUpdateText(item.id, { x: newX, y: newY });
    };
    return (
        <DraggableItem ref={itemRef} drag dragConstraints={canvasRef} dragElastic={0.05} dragMomentum={false}
            onDragStart={() => onSelectItem(item.id)} onDragEnd={handleDragEnd}
            style={{
                x: item.x, y: item.y, rotate: item.rotation || 0, fontFamily: item.fontFamily, fontSize: item.fontSize, color: item.color,
                zIndex: isSelected ? item.zIndex + 1000 : item.zIndex,
                width: 'auto', height: 'auto', padding: '2px',
                border: isSelected ? `2px dashed #000000` : `2px solid transparent`, // Changed to black
                transformOrigin: 'center center',
                opacity: item.opacity,
            }}
            dragListener={!item.isEditing}
        >
            {item.isEditing ? (
                <TextField inputRef={inputRef} value={item.content} onChange={(e) => onUpdateText(item.id, { content: e.target.value })}
                    onBlur={handleBlur} onKeyDown={handleKeyDown} onClick={(e) => e.stopPropagation()}
                    sx={{
                        '& .MuiInputBase-input': {
                           fontSize: `${item.fontSize}px`, fontFamily: item.fontFamily, color: item.color, 
                           padding: '0px 2px', lineHeight: 1.2, width: 'auto', minWidth: '50px',
                        },
                        '& .MuiOutlinedInput-root': {
                            padding: '2px', background: 'white', border: '1px solid black',
                        },
                        minWidth: '50px', boxSizing: 'border-box',
                    }}
                    size="small" variant="outlined" autoFocus multiline
                />
            ) : (
                <Typography variant="body1"
                    sx={{
                        userSelect: 'none', cursor: 'inherit', fontSize: `${item.fontSize}px`, fontFamily: item.fontFamily,
                        color: item.color, whiteSpace: 'pre-wrap', display: 'inline-block', lineHeight: 1.2,
                    }}
                    onDoubleClick={(e) => { e.stopPropagation(); onUpdateText(item.id, { isEditing: true }); }}
                    onClick={(e) => { if (!item.isEditing) { e.stopPropagation(); onSelectItem(item.id); } }}
                >{item.content || "Văn bản"}</Typography>
            )}
        </DraggableItem>
    );
};

// Image Editor Component (on canvas)
const ImageEditor = ({ item, onUpdateImage, canvasWidth, canvasHeight, isSelected, onSelectItem, canvasRef, zoomLevel }: { item: ImageItem; onUpdateImage: (id: string, updates: Partial<Omit<ImageItem, 'id'>>) => void; canvasWidth: number; canvasHeight: number; isSelected: boolean; onSelectItem: (id: string) => void; canvasRef: React.RefObject<HTMLDivElement | null>; zoomLevel: number; }) => {
    const itemRef = useRef<HTMLDivElement>(null);
    const dragStartProperties = useRef({ width: 0, height: 0, rotation: 0, aspectRatio: 1 });
    const rotateDragStartInfo = useRef<{ initialItemRotation: number; initialPointerAngle: number, itemCenterX: number, itemCenterY: number } | null>(null);

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        let newX = item.x + info.offset.x / zoomLevel; let newY = item.y + info.offset.y / zoomLevel;
        newX = Math.max(0, Math.min(newX, canvasWidth - item.width)); newY = Math.max(0, Math.min(newY, canvasHeight - item.height));
        onUpdateImage(item.id, { x: newX, y: newY });
    };
    return (
        <>
            <DraggableItem ref={itemRef} drag dragConstraints={canvasRef} dragElastic={0.05} dragMomentum={false}
                onDragStart={() => onSelectItem(item.id)} onDragEnd={handleDragEnd}
                style={{
                    x: item.x, y: item.y, rotate: item.rotation || 0,
                    zIndex: isSelected ? item.zIndex + 1000 : item.zIndex,
                    width: item.width, height: item.height,
                    border: isSelected ? `2px dashed #000000` : `2px solid transparent`, // Changed to black
                    transformOrigin: 'center center',
                    opacity: item.opacity,
                }}
            >
                {item.url ? (
                    <img src={item.url} alt="Design element" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', display: 'block' }}
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            const target = e.target as HTMLImageElement; target.onerror = null;
                            target.src = `https://placehold.co/${item.width || 100}x${item.height || 100}/E0E0E0/FFFFFF?text=Lỗi+Tải`;
                        }}
                        onClick={(e) => { e.stopPropagation(); onSelectItem(item.id); }}
                    />
                ) : (
                    <Box style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', cursor: 'pointer', textAlign: 'center', padding: '10px', boxSizing: 'border-box' }}
                        onClick={(e) => { e.stopPropagation(); onSelectItem(item.id); }}
                    >Chọn ảnh</Box>
                )}
                {isSelected && (
                    <>
                        <motion.div style={{ ...ResizeHandleStyle, bottom: `-${HANDLE_OFFSET}px`, right: `-${HANDLE_OFFSET}px` }} drag="x" 
                            onDragStart={(e) => { e.stopPropagation(); onSelectItem(item.id); dragStartProperties.current = { width: item.width, height: item.height, rotation: item.rotation || 0, aspectRatio: item.width / item.height }; }}
                            onDrag={(_event, info: PanInfo) => {
                                _event.stopPropagation(); const { width: initialWidth, height: initialHeight } = dragStartProperties.current;
                                let newWidth = initialWidth + info.offset.x / zoomLevel;
                                let newHeight = initialHeight + info.offset.y / zoomLevel;
                                onUpdateImage(item.id, { width: Math.max(MIN_ITEM_WIDTH, newWidth), height: Math.max(MIN_ITEM_HEIGHT, newHeight) });
                            }}
                            dragElastic={0} dragMomentum={false} className="handle resize-br" />
                        
                        <motion.div style={{ ...RotateHandleStyle }} drag
                            onDragStart={(_event, info: PanInfo) => {
                                _event.stopPropagation(); onSelectItem(item.id); if (itemRef.current) {
                                    const rect = itemRef.current.getBoundingClientRect(); 
                                    const itemCenterX = rect.left + (rect.width / 2); 
                                    const itemCenterY = rect.top + (rect.height / 2);
                                    const pointerX = info.point.x; const pointerY = info.point.y;
                                    const initialPointerAngle = Math.atan2(pointerY - itemCenterY, pointerX - itemCenterX);
                                    rotateDragStartInfo.current = { initialItemRotation: item.rotation || 0, initialPointerAngle, itemCenterX, itemCenterY };
                                }
                            }}
                            onDrag={(_event, info: PanInfo) => {
                                _event.stopPropagation(); if (rotateDragStartInfo.current) {
                                    const { initialItemRotation, initialPointerAngle, itemCenterX, itemCenterY } = rotateDragStartInfo.current;
                                    const pointerX = info.point.x; const pointerY = info.point.y;
                                    const currentPointerAngle = Math.atan2(pointerY - itemCenterY, pointerX - itemCenterX);
                                    const angleChange = currentPointerAngle - initialPointerAngle;
                                    let newRotation = initialItemRotation + angleChange * (180 / Math.PI);
                                    onUpdateImage(item.id, { rotation: newRotation });
                                }
                            }}
                            dragElastic={0} dragMomentum={false} className="handle rotate-top" />
                    </>
                )}
            </DraggableItem>
        </>
    );
};

// Property Editor for Text Items
const TextPropertyEditor = ({ item, onUpdate }: { item: TextItem, onUpdate: (id: string, updates: Partial<TextItem>) => void }) => (
    <Box component="form" noValidate autoComplete="off" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <TextField label="Nội dung" value={item.content} onChange={(e) => onUpdate(item.id, { content: e.target.value })} fullWidth margin="none" size="small" variant="outlined" multiline rows={3}/>
        <FormControl fullWidth margin="none" size="small">
            <InputLabel id="font-family-label">Font</InputLabel>
            <Select labelId="font-family-label" value={item.fontFamily} label="Font" onChange={(e) => onUpdate(item.id, { fontFamily: e.target.value })} >
                {FONT_FAMILIES.map(font => (<MenuItem key={font} value={font}>{font}</MenuItem>))}
            </Select>
        </FormControl>
        <TextField label="Cỡ chữ" type="number" value={item.fontSize} onChange={(e) => onUpdate(item.id, { fontSize: parseInt(e.target.value, 10) || 12 })} fullWidth margin="none" size="small" variant="outlined" InputProps={{ inputProps: { min: 8, max: 200 } }} />
        <TextField label="Màu chữ" type="color" value={item.color} onChange={(e) => onUpdate(item.id, { color: e.target.value })} fullWidth margin="none" size="small" variant="outlined" sx={{ '& input[type=color]': { height: '30px', padding: '2px', boxSizing: 'border-box', cursor:'pointer' } }} />
        <Typography gutterBottom variant="body2" sx={{mt:1}}>Xoay (độ)</Typography>
        <Slider value={item.rotation || 0} onChange={(_e, newValue) => onUpdate(item.id, { rotation: newValue as number })} aria-labelledby="rotation-slider" valueLabelDisplay="auto" step={1} marks min={-180} max={180} size="small"/>
        <TextField label="Xoay (số)" type="number" value={item.rotation || 0} onChange={(e) => onUpdate(item.id, { rotation: parseFloat(e.target.value) || 0 })} fullWidth margin="none" size="small" variant="outlined" InputProps={{ inputProps: { min: -360, max: 360, step: 1 } }} />
    </Box>
);

// Property Editor for Image Items
const ImagePropertyEditor = ({ item, onUpdate }: { item: ImageItem, onUpdate: (id: string, updates: Partial<ImageItem>) => void }) => (
    <Box component="form" noValidate autoComplete="off" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <TextField label="Chiều rộng (px)" type="number" value={item.width} onChange={(e) => onUpdate(item.id, { width: parseInt(e.target.value, 10) || MIN_ITEM_WIDTH })} fullWidth margin="none" size="small" variant="outlined" InputProps={{ inputProps: { min: MIN_ITEM_WIDTH } }} />
        <TextField label="Chiều cao (px)" type="number" value={item.height} onChange={(e) => onUpdate(item.id, { height: parseInt(e.target.value, 10) || MIN_ITEM_HEIGHT })} fullWidth margin="none" size="small" variant="outlined" InputProps={{ inputProps: { min: MIN_ITEM_HEIGHT } }} />
        <Typography gutterBottom variant="body2" sx={{mt:1}}>Xoay (độ)</Typography>
        <Slider value={item.rotation || 0} onChange={(_e, newValue) => onUpdate(item.id, { rotation: newValue as number })} aria-labelledby="rotation-slider" valueLabelDisplay="auto" step={1} marks min={-180} max={180} size="small"/>
        <TextField label="Xoay (số)" type="number" value={item.rotation || 0} onChange={(e) => onUpdate(item.id, { rotation: parseFloat(e.target.value) || 0 })} fullWidth margin="none" size="small" variant="outlined" InputProps={{ inputProps: { min: -360, max: 360, step: 1 } }} />
    </Box>
);


// Main Wedding Invitation Editor Component
const WeddingInvitationEditorContent = () => {
    const theme = useTheme(); // Use theme from ThemeProvider
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTabletOrSmaller = useMediaQuery(theme.breakpoints.down('lg')); // Covers xs, sm, md

    const [pages, setPages] = useState<Page[]>([]);
    const [currentPageId, setCurrentPageId] = useState<string | null>(null);
    
    const exportCanvasRef = useRef<HTMLCanvasElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement | null>(null);
    const canvasWrapperRef = useRef<HTMLDivElement>(null);

    const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
    const [headerMenuAnchorEl, setHeaderMenuAnchorEl] = React.useState<null | HTMLElement>(null);


    const [openTemplatePicker, setOpenTemplatePicker] = useState(false);
    const [openIconPickerDrawer, setOpenIconPickerDrawer] = useState(false);
    const [openUserImageManagerDrawer, setOpenUserImageManagerDrawer] = useState(false);
    const [userUploadedImages, setUserUploadedImages] = useState<UserUploadedImage[]>([]);
    const [openPatternPickerDrawer, setOpenPatternPickerDrawer] = useState(false);
    const [openBorderPickerDrawer, setOpenBorderPickerDrawer] = useState(false);

    const [showGuidelines, setShowGuidelines] = useState(true);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
    const isPanning = useRef(false);
    const panStart = useRef({ x: 0, y: 0 });

    const currentPage = pages.find(p => p.id === currentPageId);
    const currentItems = currentPage ? currentPage.items : [];
    const currentBackgroundImage = currentPage ? currentPage.backgroundImage : null;
    const currentCanvasWidth = currentPage ? currentPage.canvasWidth : DEFAULT_CANVAS_WIDTH;
    const currentCanvasHeight = currentPage ? currentPage.canvasHeight : DEFAULT_CANVAS_HEIGHT;

    const handleOpenTemplatePicker = () => { setOpenTemplatePicker(true); if (isMobile || isTabletOrSmaller) setLeftSidebarOpen(false); }
    const handleCloseTemplatePicker = () => setOpenTemplatePicker(false);
    const handleOpenIconPickerDrawer = () => { setOpenIconPickerDrawer(true); if (isMobile || isTabletOrSmaller) setLeftSidebarOpen(false); }
    const handleCloseIconPickerDrawer = () => setOpenIconPickerDrawer(false);
    const handleOpenUserImageManagerDrawer = () => { setOpenUserImageManagerDrawer(true); if (isMobile || isTabletOrSmaller) setLeftSidebarOpen(false); }
    const handleCloseUserImageManagerDrawer = () => setOpenUserImageManagerDrawer(false);
    const handleOpenPatternPickerDrawer = () => { setOpenPatternPickerDrawer(true); if (isMobile || isTabletOrSmaller) setLeftSidebarOpen(false); }
    const handleClosePatternPickerDrawer = () => setOpenPatternPickerDrawer(false);
    const handleOpenBorderPickerDrawer = () => { setOpenBorderPickerDrawer(true); if (isMobile || isTabletOrSmaller) setLeftSidebarOpen(false); }
    const handleCloseBorderPickerDrawer = () => setOpenBorderPickerDrawer(false);

    const handleZoomIn = () => setZoomLevel(prevZoom => Math.min(MAX_ZOOM, prevZoom + ZOOM_STEP));
    const handleZoomOut = () => setZoomLevel(prevZoom => Math.max(MIN_ZOOM, prevZoom - ZOOM_STEP));
    const handleZoomSliderChange = (_event: Event, newValue: number | number[]) => setZoomLevel(newValue as number);

    const handleSelectItem = useCallback((id: string | null) => {
        setSelectedItemId(id);
        if (id !== null && currentPageId) {
            setPages(prevPages => prevPages.map(page => {
                if (page.id === currentPageId) {
                    return {
                        ...page,
                        items: page.items.map(item =>
                            (item.type === 'text' && item.id !== id && item.isEditing) ? { ...item, isEditing: false } : item
                        )
                    };
                }
                return page;
            }));
        }
    }, [currentPageId]);

    const handleCanvasWrapperMouseDown = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        const targetElement = event.target as HTMLElement;
        
        if (('button' in event && event.button === 0) || !('button' in event)) {
             if ((targetElement === canvasContainerRef.current || targetElement === event.currentTarget || targetElement === canvasWrapperRef.current) && !targetElement.closest('.handle')) {
                handleSelectItem(null);
                if (currentPageId) {
                    setPages(prevPages => prevPages.map(page => {
                        if (page.id === currentPageId) {
                            return {
                                ...page,
                                items: page.items.map(item =>
                                    item.type === 'text' && item.isEditing ? { ...item, isEditing: false } : item
                                )
                            };
                        }
                        return page;
                    }));
                }
            }
        }

        const isPanTrigger = ('button' in event && event.button === 1) || ('button' in event && event.button === 0 && event.ctrlKey) || ('touches' in event && event.touches.length === 2);

        if (isPanTrigger) { 
            event.preventDefault(); 
            isPanning.current = true;
            const currentX = 'touches' in event ? event.touches[0].clientX : event.clientX;
            const currentY = 'touches' in event ? event.touches[0].clientY : event.clientY;
            panStart.current = { x: currentX, y: currentY };
            if (canvasWrapperRef.current) canvasWrapperRef.current.style.cursor = 'grabbing';

            const handleGlobalMouseMove = (e: MouseEvent | TouchEvent) => {
                if (!isPanning.current) return;
                const moveX = 'touches' in e ? e.touches[0].clientX : e.clientX;
                const moveY = 'touches' in e ? e.touches[0].clientY : e.clientY;
                const dx = moveX - panStart.current.x; 
                const dy = moveY - panStart.current.y;
                setViewOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                panStart.current = { x: moveX, y: moveY };
            };

            const handleGlobalMouseUp = () => {
                if (isPanning.current) {
                    isPanning.current = false;
                    if (canvasWrapperRef.current) canvasWrapperRef.current.style.cursor = 'grab';
                    window.removeEventListener('mousemove', handleGlobalMouseMove as EventListener);
                    window.removeEventListener('mouseup', handleGlobalMouseUp as EventListener);
                    window.removeEventListener('touchmove', handleGlobalMouseMove as EventListener);
                    window.removeEventListener('touchend', handleGlobalMouseUp as EventListener);
                }
            };
            window.addEventListener('mousemove', handleGlobalMouseMove as EventListener);
            window.addEventListener('mouseup', handleGlobalMouseUp as EventListener);
            window.addEventListener('touchmove', handleGlobalMouseMove as EventListener);
            window.addEventListener('touchend', handleGlobalMouseUp as EventListener);
        }
    };


    const handleCanvasWrapperContextMenu = (event: React.MouseEvent<HTMLDivElement>) => event.preventDefault();

    const getNextZIndex = useCallback(() => {
        if (!currentPage || currentItems.length === 0) return BASE_Z_INDEX;
        return Math.max(...currentItems.map(item => item.zIndex), BASE_Z_INDEX - 1) + 1;
    }, [currentItems, currentPage]);

    const handleSelectTemplate = useCallback((selectedTemplateId: string) => {
        if (!currentPageId) return; 

        const selectedTemplate = TEMPLATES.find(t => t.id === selectedTemplateId);
        if (selectedTemplate) { 
            setPages(prevPages => prevPages.map(page => {
                if (page.id === currentPageId) {
                    return {
                        ...page,
                        backgroundImage: selectedTemplate.imageUrl,
                        canvasWidth: selectedTemplate.width, 
                        canvasHeight: selectedTemplate.height, 
                        items: [], 
                        templateId: selectedTemplate.id,
                    };
                }
                return page;
            }));
            setSelectedItemId(null); 
            handleCloseTemplatePicker();
            setZoomLevel(1); setViewOffset({ x: 0, y: 0 });
        }
    }, [currentPageId]);
    
    const handleAddPage = () => {
        const newPageId = uuidv4();
        const newPageNumber = pages.length + 1;
        
        const defaultTemplate: Template = TEMPLATES.length > 0 ? TEMPLATES[0] : { 
            id: 'fallback_default', 
            name: 'Mẫu Mặc Định', 
            imageUrl: null, 
            width: DEFAULT_CANVAS_WIDTH, 
            height: DEFAULT_CANVAS_HEIGHT 
        };

        const newPage: Page = {
            id: newPageId,
            name: `Trang ${newPageNumber}`,
            items: [],
            backgroundImage: defaultTemplate.imageUrl,
            canvasWidth: defaultTemplate.width, 
            canvasHeight: defaultTemplate.height, 
            templateId: defaultTemplate.id,
        };
        setPages(prevPages => [...prevPages, newPage]);
        setCurrentPageId(newPageId);
        setSelectedItemId(null);
        setZoomLevel(1);
        setViewOffset({x:0, y:0});
    };
    
    useEffect(() => {
        if (pages.length === 0) {
            const firstPageId = uuidv4();
            const defaultTemplate: Template = TEMPLATES.length > 0 ? TEMPLATES[0] : { 
                id: 'fallback_default_init', 
                name: 'Mẫu Mặc Định', 
                imageUrl: null, 
                width: DEFAULT_CANVAS_WIDTH, 
                height: DEFAULT_CANVAS_HEIGHT 
            };
            setPages([{
                id: firstPageId,
                name: 'Trang 1',
                items: [],
                backgroundImage: defaultTemplate.imageUrl,
                canvasWidth: defaultTemplate.width, 
                canvasHeight: defaultTemplate.height, 
                templateId: defaultTemplate.id,
            }]);
            setCurrentPageId(firstPageId);
        } else if (!currentPageId && pages.length > 0) {
            setCurrentPageId(pages[0].id); 
        }
    }, [pages, currentPageId]);


    const handleAddText = useCallback(() => {
        if (!currentPage) return;
        const newZIndex = getNextZIndex();
        const newTextItem: TextItem = {
            id: uuidv4(), content: 'Nội dung mới', 
            x: currentPage.canvasWidth / 2 - 50, y: currentPage.canvasHeight / 2 - 15,
            fontFamily: 'Arial', fontSize: 24, color: '#333333', isEditing: true, 
            type: 'text', rotation: 0, opacity: 1, zIndex: newZIndex,
        };
        setPages(prevPages => prevPages.map(page => 
            page.id === currentPageId ? { ...page, items: [...page.items, newTextItem] } : page
        ));
        setSelectedItemId(newTextItem.id);
        if (isMobile || isTabletOrSmaller) setLeftSidebarOpen(false); 
    }, [currentPage, currentPageId, getNextZIndex, isMobile, isTabletOrSmaller]);

    const addImageToCanvas = useCallback((imageUrl: string) => {
        if (!currentPage) return;
        const newZIndex = getNextZIndex();
        const img = new Image(); img.crossOrigin = "anonymous";
        img.onload = () => {
            const aspectRatio = img.width / img.height;
            let newWidth = Math.min(img.width, currentPage.canvasWidth * 0.25);
            let newHeight = newWidth / aspectRatio;
            if (newHeight > currentPage.canvasHeight * 0.25) { newHeight = currentPage.canvasHeight * 0.25; newWidth = newHeight * aspectRatio; }
            const newImageItem: ImageItem = {
                id: uuidv4(), url: imageUrl, 
                x: currentPage.canvasWidth / 2 - newWidth / 2, y: currentPage.canvasHeight / 2 - newHeight / 2,
                width: newWidth, height: newHeight, rotation: 0, type: 'image', opacity: 1, zIndex: newZIndex,
            };
            setPages(prevPages => prevPages.map(page => 
                page.id === currentPageId ? { ...page, items: [...page.items, newImageItem] } : page
            ));
            setSelectedItemId(newImageItem.id);
        };
        img.onerror = (e) => console.error("Lỗi tải ảnh để thêm vào canvas:", imageUrl, e);
        img.src = imageUrl;
    }, [currentPage, currentPageId, getNextZIndex]);

    const handleAddIconFromPicker = useCallback((imageUrl: string) => { addImageToCanvas(imageUrl); handleCloseIconPickerDrawer(); }, [addImageToCanvas]);
    const handleAddUserImageToCanvas = useCallback((imageUrl: string) => { addImageToCanvas(imageUrl); handleCloseUserImageManagerDrawer(); }, [addImageToCanvas]);
    const handleAddPatternImageFromPicker = useCallback((imageUrl: string) => { addImageToCanvas(imageUrl); handleClosePatternPickerDrawer(); }, [addImageToCanvas]);
    const handleAddBorderImageFromPicker = useCallback((imageUrl: string) => { addImageToCanvas(imageUrl); handleCloseBorderPickerDrawer(); }, [addImageToCanvas]);
    
    const handleUserImageFileUpload = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            if (imageUrl) {
                const newUserImage: UserUploadedImage = { id: uuidv4(), name: file.name, url: imageUrl };
                setUserUploadedImages(prev => [newUserImage, ...prev]);
            }
        };
        reader.onerror = (e) => console.error("File reading error:", e);
        reader.readAsDataURL(file);
    }, []);

    const handleUpdateItem = useCallback((itemId: string, updates: Partial<DesignItem>) => {
        if (!currentPageId) return;
        setPages(prevPages => prevPages.map(page => {
            if (page.id === currentPageId) {
                return {
                    ...page,
                    items: page.items.map(item => item.id === itemId ? { ...item, ...updates } as DesignItem : item)
                };
            }
            return page;
        }));
    }, [currentPageId]);

    const handleDeleteItem = useCallback((itemId: string) => {
        if (!currentPageId) return;
        setPages(prevPages => prevPages.map(page => {
            if (page.id === currentPageId) {
                return { ...page, items: page.items.filter(item => item.id !== itemId) };
            }
            return page;
        }));
        if (selectedItemId === itemId) setSelectedItemId(null);
    }, [currentPageId, selectedItemId]);

    const handleBringToFront = useCallback((itemId: string) => {
        if (!currentPageId) return;
        setPages(prevPages => prevPages.map(p => {
            if (p.id === currentPageId) {
                const itemToMove = p.items.find(item => item.id === itemId);
                if (!itemToMove) return p;
                const maxZIndex = p.items.length > 0 ? Math.max(...p.items.filter(i => i.id !== itemId).map(i => i.zIndex), BASE_Z_INDEX -1) : BASE_Z_INDEX -1;
                const updatedItem = { ...itemToMove, zIndex: maxZIndex + 1 };
                return {...p, items: p.items.filter(i => i.id !== itemId).concat(updatedItem).sort((a,b) => a.zIndex - b.zIndex) };
            }
            return p;
        }));
    }, [currentPageId]);

    const handleSendToBack = useCallback((itemId: string) => {
        if (!currentPageId) return;
        setPages(prevPages => prevPages.map(p => {
            if (p.id === currentPageId) {
                const itemToMove = p.items.find(item => item.id === itemId);
                if (!itemToMove) return p;
                const minZIndex = p.items.length > 0 ? Math.min(...p.items.filter(i => i.id !== itemId).map(i => i.zIndex), BASE_Z_INDEX +1) : BASE_Z_INDEX +1;
                const updatedItem = { ...itemToMove, zIndex: Math.max(BASE_Z_INDEX, minZIndex - 1) };
                return {...p, items: [updatedItem, ...p.items.filter(i => i.id !== itemId)].sort((a,b) => a.zIndex - b.zIndex) };
            }
            return p;
        }));
    }, [currentPageId]);

    useEffect(() => {
        const displayCanvas = document.getElementById('background-display-canvas') as HTMLCanvasElement;
        const context = displayCanvas?.getContext('2d');
        if (!displayCanvas || !context || !currentPage) {
            if (displayCanvas && context) {
                context.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
            }
            return;
        }

        displayCanvas.width = currentCanvasWidth; 
        displayCanvas.height = currentCanvasHeight;
        context.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
        
        const drawBackground = () => new Promise<void>((resolve) => {
            if (currentBackgroundImage) {
                const img = new Image(); img.crossOrigin = "anonymous";
                img.onload = () => { context.drawImage(img, 0, 0, displayCanvas.width, displayCanvas.height); resolve(); };
                img.onerror = (e) => { 
                    context.fillStyle = '#e0e0e0'; 
                    context.fillRect(0, 0, displayCanvas.width, displayCanvas.height); 
                    resolve(); 
                    console.error("Lỗi tải ảnh nền cho canvas:", currentBackgroundImage, "Chi tiết lỗi:", e);
                };
                img.src = currentBackgroundImage;
            } else { context.fillStyle = '#f8f8f8'; context.fillRect(0, 0, displayCanvas.width, displayCanvas.height); resolve(); }
        });

        const drawGuidelinesFunc = () => {
            if (showGuidelines) {
                context.beginPath(); context.setLineDash([5, 5]); context.strokeStyle = 'rgba(0,0,0,0.3)'; 
                context.lineWidth = Math.max(0.5, 0.5 / zoomLevel); 
                context.moveTo(0, currentCanvasHeight / 2); context.lineTo(currentCanvasWidth, currentCanvasHeight / 2);
                context.moveTo(currentCanvasWidth / 2, 0); context.lineTo(currentCanvasWidth / 2, currentCanvasHeight);
                context.stroke(); context.setLineDash([]);
            }
        };
        drawBackground().then(drawGuidelinesFunc);
    }, [currentBackgroundImage, currentCanvasWidth, currentCanvasHeight, showGuidelines, zoomLevel, currentPage]);

    useEffect(() => { if (zoomLevel === 1) setViewOffset({ x: 0, y: 0 }); }, [zoomLevel]);
    useEffect(() => {
        const wrapper = canvasWrapperRef.current;
        if (wrapper) wrapper.style.cursor = isPanning.current ? 'grabbing' : 'grab';
    }, [isPanning.current]);

    const handleSave = async () => {
        const exportCvs = exportCanvasRef.current;
        if (!exportCvs || pages.length === 0) {
            console.error('Canvas không khả dụng hoặc không có trang nào để xuất.');
            return;
        }

        const previouslySelectedItemId = selectedItemId;
        const previouslySelectedPageId = currentPageId;
        setSelectedItemId(null); 

        await new Promise(resolve => setTimeout(resolve, 50));

        const exportCtx = exportCvs.getContext('2d');
        if (!exportCtx) {
            console.error('Không thể lấy context 2D cho canvas export.');
            if (previouslySelectedPageId) setCurrentPageId(previouslySelectedPageId);
            if (previouslySelectedItemId) setSelectedItemId(previouslySelectedItemId);
            return;
        }

        const zip = new JSZip();

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            
            exportCvs.width = page.canvasWidth;
            exportCvs.height = page.canvasHeight;
            exportCtx.fillStyle = '#FFFFFF'; 
            exportCtx.fillRect(0, 0, exportCvs.width, exportCvs.height);

            if (page.backgroundImage) {
                try {
                    const bgImage = new Image();
                    bgImage.crossOrigin = "anonymous";
                    await new Promise<void>((resolve, reject) => {
                        bgImage.onload = () => {
                            exportCtx.drawImage(bgImage, 0, 0, page.canvasWidth, page.canvasHeight);
                            resolve();
                        };
                        bgImage.onerror = (e) => {
                            console.error(`Lỗi tải ảnh nền cho trang ${i + 1} (${page.backgroundImage}):`, e);
                            exportCtx.fillStyle = '#e0e0e0'; 
                            exportCtx.fillRect(0, 0, page.canvasWidth, page.canvasHeight);
                            resolve(); 
                        };
                        bgImage.src = page.backgroundImage;
                    });
                } catch (e) {
                    console.error(`Exception khi tải ảnh nền trang ${i + 1}:`, e);
                    exportCtx.fillStyle = '#cccccc'; 
                    exportCtx.fillRect(0, 0, page.canvasWidth, page.canvasHeight);
                }
            } else {
                exportCtx.fillStyle = '#f8f8f8'; 
                exportCtx.fillRect(0, 0, page.canvasWidth, page.canvasHeight);
            }

            const sortedItems = [...page.items].sort((a, b) => a.zIndex - b.zIndex);
            for (const item of sortedItems) {
                exportCtx.save();
                exportCtx.globalAlpha = item.opacity;
                
                let itemCenterX: number = 0;
                let itemCenterYOnPage: number = 0;

                if (item.type === 'text') {
                    exportCtx.font = `${item.fontSize}px "${item.fontFamily}"`;
                    const textMetrics = exportCtx.measureText(item.content);
                    const textWidth = textMetrics.width;
                    const lines = item.content.split('\n');
                    const textHeightApprox = item.fontSize * 1.2 * lines.length; 

                    itemCenterX = item.x + textWidth / 2;
                    itemCenterYOnPage = item.y + textHeightApprox / 2;
                    
                    exportCtx.translate(itemCenterX, itemCenterYOnPage);
                    exportCtx.rotate((item.rotation || 0) * Math.PI / 180);
                    exportCtx.fillStyle = item.color;
                    exportCtx.textAlign = 'center';
                    exportCtx.textBaseline = 'middle';
                    
                    lines.forEach((line, index) => {
                        exportCtx.fillText(line, 0, (index - (lines.length - 1) / 2) * item.fontSize * 1.2);
                    });

                } else if (item.type === 'image' && item.url) {
                    itemCenterX = item.x + item.width / 2;
                    itemCenterYOnPage = item.y + item.height / 2;
                    try {
                        const itemImg = new Image();
                        itemImg.crossOrigin = "anonymous";
                        await new Promise<void>((resolve, reject) => {
                            itemImg.onload = () => {
                                exportCtx.save();
                                exportCtx.translate(itemCenterX, itemCenterYOnPage);
                                exportCtx.rotate((item.rotation || 0) * Math.PI / 180);
                                exportCtx.drawImage(itemImg, -item.width / 2, -item.height / 2, item.width, item.height);
                                exportCtx.restore();
                                resolve();
                            };
                            itemImg.onerror = (e) => { 
                                console.error(`Lỗi tải ảnh item (${item.url}) cho trang ${i + 1}:`, e); 
                                resolve(); 
                            };
                            itemImg.src = item.url;
                        });
                    } catch (e) {
                        console.error(`Exception khi tải ảnh item cho trang ${i + 1}:`, e);
                    }
                }
                exportCtx.restore();
            }
            
            const pageDataUrl = exportCvs.toDataURL('image/png');
            const base64Data = pageDataUrl.split(',')[1]; 
            zip.file(`trang_${i + 1}_${page.name.replace(/[^a-z0-9]/gi, '_')}.png`, base64Data, { base64: true });
        }

        try {
            const zipBlob = await zip.generateAsync({ type: "blob" });
            const zipFileName = "thiep_moi_cuoi_cac_trang.zip";
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = zipFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href); 
        } catch (e) {
            console.error("Lỗi tạo hoặc tải file ZIP:", e);
        }
        
        if (previouslySelectedPageId) setCurrentPageId(previouslySelectedPageId);
        if (previouslySelectedItemId) setSelectedItemId(previouslySelectedItemId);
    };


    const activeItem = currentPage ? currentItems.find(i => i.id === selectedItemId) : null;

    const handleHeaderMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setHeaderMenuAnchorEl(event.currentTarget);
    };
    const handleHeaderMenuClose = () => {
        setHeaderMenuAnchorEl(null);
    };


    // Left Sidebar Content
    const leftSidebarContent = (
         <Box sx={{ p: 1.5, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
            <Button fullWidth variant="text" startIcon={<ArrowBackIcon />} sx={{ justifyContent: 'flex-start', color: 'text.secondary' }}>Trở về</Button>
            <Button fullWidth variant="contained" startIcon={<DesignServicesIcon />} sx={{ justifyContent: 'flex-start' }} color="primary">Thiết kế</Button>
            <Divider sx={{ my: 1 }} />
            <Typography variant="overline" color="text.secondary" sx={{px:1}}>Công cụ</Typography>
            <Button fullWidth variant="text" startIcon={<StyleIcon />} onClick={handleOpenTemplatePicker} sx={{ justifyContent: 'flex-start' }} disabled={!currentPageId}>Mẫu</Button>
            <Button fullWidth variant="text" startIcon={<TextFieldsIcon />} onClick={handleAddText} sx={{ justifyContent: 'flex-start' }} disabled={!currentPageId}>Văn bản</Button>
            <Button fullWidth variant="text" startIcon={<CloudUploadIcon />} onClick={handleOpenUserImageManagerDrawer} sx={{ justifyContent: 'flex-start' }} disabled={!currentPageId}>Tải ảnh lên</Button>
            <Button fullWidth variant="text" startIcon={<ImageIcon />} onClick={handleOpenIconPickerDrawer} sx={{ justifyContent: 'flex-start' }} disabled={!currentPageId}>Icon</Button>
            <Button fullWidth variant="text" startIcon={<CategoryIcon />} onClick={handleOpenPatternPickerDrawer} sx={{ justifyContent: 'flex-start' }} disabled={!currentPageId}>Thành phần</Button>
            <Button fullWidth variant="text" startIcon={<LabelIcon />} onClick={handleOpenBorderPickerDrawer} sx={{ justifyContent: 'flex-start' }} disabled={!currentPageId}>Tag/Khung</Button>
            <FormControlLabel control={<Checkbox checked={showGuidelines} onChange={(e) => setShowGuidelines(e.target.checked)} size="small" />} label="Dòng kẻ" sx={{ mt: 'auto', color:'text.secondary' }} />
        </Box>
    );

    // Right Sidebar Content
    const rightSidebarContent = (
        <Box sx={{ p: 2, overflowY: 'auto', display:'flex', flexDirection:'column', gap:2, height: '100%' }}>
            <Box>
                <Typography variant="h6" gutterBottom>Trang thiệp</Typography>
                <Box sx={{display:'flex', flexDirection:'column', gap:1, maxHeight: {xs: '25vh', sm: '30vh'}, overflowY:'auto', mb:1, pr:0.5 }}>
                    {pages.map((page) => ( 
                        <Card 
                            key={page.id} 
                            onClick={() => {setCurrentPageId(page.id); setSelectedItemId(null); setZoomLevel(1); setViewOffset({x:0,y:0}); if(isMobile || isTabletOrSmaller) setRightSidebarOpen(false);}}
                            sx={{ 
                                cursor: 'pointer', 
                                border: `2px solid ${page.id === currentPageId ? theme.palette.primary.main : theme.palette.divider}`,
                                '&:hover': { borderColor: theme.palette.primary.light },
                                minHeight: 80,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                p:1,
                                position: 'relative' 
                            }}
                        >
                            {page.backgroundImage ? 
                                <CardMedia component="img" height="50" image={page.backgroundImage} alt={page.name} sx={{ objectFit: 'contain', maxWidth:'100%' }} 
                                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                        const target = e.target as HTMLImageElement; target.onerror = null;
                                        target.style.display = 'none'; 
                                    }}
                                /> : 
                                <FileCopyIcon sx={{fontSize: 30, color: 'text.disabled'}}/>
                            }
                            <Typography variant="caption" sx={{mt:0.5}}>{page.name}</Typography>
                            <Typography variant="caption" color="textSecondary" sx={{fontSize: '0.65rem'}}>
                                ({page.canvasWidth}x{page.canvasHeight})
                            </Typography>
                        </Card>
                    ))}
                </Box>
                <Button startIcon={<AddCircleOutlineIcon />} fullWidth sx={{mt:1}} variant="outlined" size="small" onClick={handleAddPage}>Thêm trang</Button>
            </Box>
            <Divider />
            <Box sx={{flexGrow:1, overflowY: 'auto', pb:2}}>
                <Typography variant="h6" gutterBottom>Thuộc tính</Typography>
                {activeItem?.type === 'text' && currentPageId && (
                    <TextPropertyEditor item={activeItem as TextItem} onUpdate={handleUpdateItem} />
                )}
                {activeItem?.type === 'image' && currentPageId && (
                    <ImagePropertyEditor item={activeItem as ImageItem} onUpdate={handleUpdateItem} />
                )}
                {!selectedItemId && currentPageId && <Typography variant="body2" color="textSecondary" sx={{textAlign:'center', mt:2}}>Chọn đối tượng trên trang hiện tại để sửa.</Typography>}
                {!currentPageId && <Typography variant="body2" color="textSecondary" sx={{textAlign:'center', mt:2}}>Vui lòng chọn hoặc thêm một trang để bắt đầu.</Typography>}
            </Box>
        </Box>
    );

    // Show message on unsupported devices
    if (isTabletOrSmaller) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                <Typography variant="h5" color="text.primary">
                    Hiện tại chức năng này chưa hỗ trợ trên thiết bị điện thoại và máy tính bảng.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column', fontFamily: 'Inter, sans-serif', bgcolor: 'white' }}>
            {/* Top Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', p: {xs: '4px 8px', sm: '4px 16px'}, backgroundColor: 'white', color: 'black', flexShrink: 0, boxShadow: 2, height: 56 }}>
                {isMobile && ( // This isMobile is now only for the menu icon if isTabletOrSmaller hasn't returned early
                    <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 1 }} onClick={() => setLeftSidebarOpen(true)}>
                        <MenuIcon />
                    </IconButton>
                )}
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', letterSpacing: '0.5px', fontSize: {xs: '1rem', sm: '1.25rem'} }}>Image Canvas</Typography>
                
                {!isMobile && ( // This !isMobile is now only for desktop if isTabletOrSmaller hasn't returned early
                     <Button startIcon={<PeopleAltIcon />} variant="outlined" size="small" sx={{ ml: 2, color: 'black', borderColor: alpha(theme.palette.common.black, 0.23), '&:hover': {borderColor: theme.palette.common.black} }}>QL Khách mời</Button>
                )}

                <Typography variant="body2" sx={{ ml: 'auto', mr: {xs:1, sm:2}, fontStyle: 'italic', display: {xs: 'none', md: 'block'} }}>{currentPage?.name || "Thiệp không tên"}</Typography>
                
                {isMobile ? (  // This isMobile is now only for the menu icon if isTabletOrSmaller hasn't returned early
                    <>
                        <IconButton color="inherit" onClick={handleHeaderMenuOpen} sx={{ml: 'auto'}}>
                            <MoreVertIcon />
                        </IconButton>
                        <Menu
                            anchorEl={headerMenuAnchorEl}
                            open={Boolean(headerMenuAnchorEl)}
                            onClose={handleHeaderMenuClose}
                        >
                            <MenuItem onClick={() => { /* QL Khách mời logic */ handleHeaderMenuClose(); }}>
                                <PeopleAltIcon sx={{mr:1}} fontSize="small"/> QL Khách mời
                            </MenuItem>
                            <MenuItem onClick={() => { /* Save logic */ handleHeaderMenuClose(); }}>
                                <SaveIcon sx={{mr:1}} fontSize="small"/> Lưu
                            </MenuItem>
                            <MenuItem onClick={() => { /* Print logic */ handleHeaderMenuClose(); }}>
                                <PrintIcon sx={{mr:1}} fontSize="small"/> In
                            </MenuItem>
                            <MenuItem onClick={() => { handleSave(); handleHeaderMenuClose();}}>
                                <DownloadIcon sx={{mr:1}} fontSize="small"/> Tải ZIP
                            </MenuItem>
                        </Menu>
                        <IconButton color="inherit" onClick={() => setRightSidebarOpen(true)} sx={{ ml: 1 }}>
                            <SettingsIcon />
                        </IconButton>
                    </>
                ) : (
                    <>
                        <Tooltip title="Lưu thiệp (chưa hoạt động)"><IconButton size="small" sx={{color: 'black'}}><SaveIcon /></IconButton></Tooltip>
                        <Tooltip title="In thiệp mời (chưa hoạt động)"><IconButton size="small" sx={{color: 'black'}}><PrintIcon /></IconButton></Tooltip>
                        <Button variant="contained" color="primary" onClick={handleSave} size="small" startIcon={<DownloadIcon />}>Tải ZIP</Button>
                    </>
                )}
            </Box>

            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                {/* Left Sidebar - Desktop */}
                {!isMobile && (
                    <Box sx={{ width: LEFT_SIDEBAR_WIDTH_DESKTOP, borderRight: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper', flexShrink: 0 }}>
                        {leftSidebarContent}
                    </Box>
                )}
                {/* Left Sidebar - Mobile Drawer (will not be shown if isTabletOrSmaller is true due to early return) */}
                <Drawer anchor="left" open={isMobile && leftSidebarOpen} onClose={() => setLeftSidebarOpen(false)} PaperProps={{ sx: { width: MOBILE_DRAWER_WIDTH } }}>
                    {leftSidebarContent}
                </Drawer>


                {/* Center Stage (Canvas Area) */}
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: 'grey.200', p: {xs: 1, sm: 1.5}, overflow: 'hidden' }}>
                    {activeItem && currentPageId && ( 
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: {xs:0.5, sm:1}, borderBottom: `1px solid ${theme.palette.divider}`, gap: {xs:0.2, sm:0.5}, flexShrink: 0, flexWrap: 'wrap', mb: 1, bgcolor: 'background.paper', borderRadius:1 }}>
                            <Typography variant="caption" sx={{ mr: {xs:0.5, sm:1}, flexShrink: 0, fontWeight: 500, fontSize: {xs: '0.7rem', sm: 'caption.fontSize'} }}>
                                Đối tượng: {activeItem.type === 'text' ? `"${(activeItem as TextItem).content.substring(0, 10)}${(activeItem as TextItem).content.length > 10 ? "..." : ""}"` : 'Ảnh'}
                            </Typography>
                            <Tooltip title="Độ mờ"><OpacityIcon fontSize="small" sx={{ mr: {xs:0.2, sm:0.5}, color: 'action.active', verticalAlign:'middle' }} /></Tooltip>
                            <Slider value={activeItem.opacity} onChange={(_e, newValue) => handleUpdateItem(selectedItemId!, { opacity: newValue as number })} min={0} max={1} step={0.01} sx={{ width: {xs:60, sm:80}, mr: {xs:0.5, sm:1} }} size="small" />
                            <Tooltip title="Đưa lên trên cùng"><IconButton size="small" onClick={() => handleBringToFront(selectedItemId!)}><FlipToFrontIcon /></IconButton></Tooltip>
                            <Tooltip title="Đưa xuống dưới cùng"><IconButton size="small" onClick={() => handleSendToBack(selectedItemId!)}><FlipToBackIcon /></IconButton></Tooltip>
                            <Tooltip title="Xóa đối tượng"><IconButton size="small" color="error" onClick={() => handleDeleteItem(selectedItemId!)}><DeleteIcon /></IconButton></Tooltip>
                        </Box>
                    )}
                    <CanvasWrapper ref={canvasWrapperRef} onMouseDown={handleCanvasWrapperMouseDown} onTouchStart={handleCanvasWrapperMouseDown as any} onContextMenu={handleCanvasWrapperContextMenu} sx={{ flexGrow: 1, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
                        {currentPage ? (
                            <CanvasContainer ref={canvasContainerRef}
                                style={{
                                    width: currentCanvasWidth, height: currentCanvasHeight,
                                    transform: `translateX(${viewOffset.x}px) translateY(${viewOffset.y}px) scale(${zoomLevel})`,
                                    transformOrigin: 'center center',
                                    transition: isPanning.current ? 'none' : 'transform 0.1s ease-out',
                                }}
                            >
                                <StyledCanvas id="background-display-canvas" />
                                <AnimatePresence>
                                    {currentItems.sort((a, b) => a.zIndex - b.zIndex).map(item => {
                                        if (item.type === 'text') {
                                            return <TextEditor key={item.id} item={item} onUpdateText={handleUpdateItem}
                                                canvasWidth={currentCanvasWidth} canvasHeight={currentCanvasHeight}
                                                isSelected={selectedItemId === item.id} onSelectItem={handleSelectItem}
                                                canvasRef={canvasContainerRef} zoomLevel={zoomLevel} />;
                                        }
                                        if (item.type === 'image') {
                                            return <ImageEditor key={item.id} item={item} onUpdateImage={handleUpdateItem}
                                                canvasWidth={currentCanvasWidth} canvasHeight={currentCanvasHeight}
                                                isSelected={selectedItemId === item.id} onSelectItem={handleSelectItem}
                                                canvasRef={canvasContainerRef} zoomLevel={zoomLevel} />;
                                        }
                                        return null;
                                    })}
                                </AnimatePresence>
                            </CanvasContainer>
                        ) : (
                            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                                <Typography variant="h5" color="text.secondary" textAlign="center" p={2}>Vui lòng chọn hoặc thêm một trang.</Typography>
                            </Box>
                        )}
                    </CanvasWrapper>
                     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: {xs:0.5, sm:1}, p: {xs:0.5, sm:1}, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper', flexShrink: 0, borderRadius: '0 0 4px 4px', mt:1 }}>
                        <IconButton onClick={handleZoomOut} disabled={zoomLevel <= MIN_ZOOM || !currentPageId} size="small" aria-label="Thu nhỏ"><ZoomOutIcon /></IconButton>
                        <Slider value={zoomLevel} onChange={handleZoomSliderChange} min={MIN_ZOOM} max={MAX_ZOOM} step={0.01} sx={{ width: {xs:100, sm:150}, mx: {xs:0.5, sm:1} }} size="small" disabled={!currentPageId}/>
                        <Typography variant="body2" sx={{ minWidth: {xs:'40px', sm:'50px'}, textAlign: 'center' }}>{currentPageId ? Math.round(zoomLevel * 100) : 0}%</Typography>
                        <IconButton onClick={handleZoomIn} disabled={zoomLevel >= MAX_ZOOM || !currentPageId} size="small" aria-label="Phóng to"><ZoomInIcon /></IconButton>
                    </Box>
                </Box>

                {/* Right Sidebar - Desktop */}
                {!isMobile && ( // This !isMobile is now only for desktop if isTabletOrSmaller hasn't returned early
                    <Box sx={{ width: RIGHT_SIDEBAR_WIDTH_DESKTOP, borderLeft: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper', flexShrink:0 }}>
                       {rightSidebarContent}
                    </Box>
                )}
                 {/* Right Sidebar - Mobile Drawer (will not be shown if isTabletOrSmaller is true due to early return) */}
                <Drawer anchor="right" open={isMobile && rightSidebarOpen} onClose={() => setRightSidebarOpen(false)} PaperProps={{ sx: { width: MOBILE_DRAWER_WIDTH } }}>
                    {rightSidebarContent}
                </Drawer>

            </Box>

            <canvas ref={exportCanvasRef} style={{ display: 'none' }} />

            {/* Drawers for Pickers */}
            <Drawer open={openTemplatePicker} onClose={handleCloseTemplatePicker} anchor="left" PaperProps={{sx: {width: {xs: MOBILE_DRAWER_WIDTH, sm: LEFT_SIDEBAR_WIDTH_DESKTOP + 60}}}}>
                <Box sx={{ p: 1, boxSizing: 'border-box' }}> <TemplatePicker templates={TEMPLATES} onSelectTemplate={handleSelectTemplate} /> </Box>
            </Drawer>
            <Drawer open={openIconPickerDrawer} onClose={handleCloseIconPickerDrawer} anchor="left" PaperProps={{sx: {width: {xs: MOBILE_DRAWER_WIDTH, sm: LEFT_SIDEBAR_WIDTH_DESKTOP + 60}}}}>
                <Box sx={{ p: 1, boxSizing: 'border-box' }}> <GenericImagePicker images={ICON_IMAGES} onSelectImage={handleAddIconFromPicker} title="Chọn Icon" /> </Box>
            </Drawer>
            <Drawer open={openUserImageManagerDrawer} onClose={handleCloseUserImageManagerDrawer} anchor="left" PaperProps={{sx: {width: {xs: MOBILE_DRAWER_WIDTH, sm: LEFT_SIDEBAR_WIDTH_DESKTOP + 80}}}}>
                <Box sx={{ p: 1, boxSizing: 'border-box' }}> <UserImageManager userImages={userUploadedImages} onSelectUserImage={handleAddUserImageToCanvas} onImageUploaded={handleUserImageFileUpload} /> </Box>
            </Drawer>
            <Drawer open={openPatternPickerDrawer} onClose={handleClosePatternPickerDrawer} anchor="left" PaperProps={{sx: {width: {xs: MOBILE_DRAWER_WIDTH, sm: LEFT_SIDEBAR_WIDTH_DESKTOP + 60}}}}>
                <Box sx={{ p: 1, boxSizing: 'border-box' }}> <GenericImagePicker images={COMPONENT_IMAGES} onSelectImage={handleAddPatternImageFromPicker} title="Chọn Thành Phần" /> </Box>
            </Drawer>
            <Drawer open={openBorderPickerDrawer} onClose={handleCloseBorderPickerDrawer} anchor="left" PaperProps={{sx: {width: {xs: MOBILE_DRAWER_WIDTH, sm: LEFT_SIDEBAR_WIDTH_DESKTOP + 60}}}}>
                <Box sx={{ p: 1, boxSizing: 'border-box' }}> <GenericImagePicker images={TAG_IMAGES} onSelectImage={handleAddBorderImageFromPicker} title="Chọn Tag/Khung" /> </Box>
            </Drawer>
        </Box>
    );
};

export default WeddingInvitationEditor;
