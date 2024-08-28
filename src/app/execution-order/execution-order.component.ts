import { Component } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { ExecutionOrderService } from './execution-order.service';
import { ServiceMaster } from '../models/service-master.model';
import { UnitOfMeasure } from '../models/unitOfMeasure.model';
import { ApiService } from '../shared/ApiService.service';
import * as FileSaver from 'file-saver';


import { MainItem, SubItem } from './execution-order.model';
import { MaterialGroup } from '../models/materialGroup.model';
import { ServiceType } from '../models/serviceType.model';
import { LineType } from '../models/lineType.model';
import { main } from '@popperjs/core';
import { NavigationExtras, Router } from '@angular/router';

@Component({
  selector: 'app-execution-order',
  templateUrl: './execution-order.component.html',
  //'./new.component.html',
  //./execution-order.component.html
  styleUrls: ['./execution-order.component.scss'],
  providers: [MessageService, ExecutionOrderService, ConfirmationService]
})
export class ExecutionOrderComponent {
  searchKey: string = ""
  currency: any
  totalValue: number = 0.0
  //fields for dropdown lists
  recordsServiceNumber!: ServiceMaster[];
  selectedServiceNumberRecord?: ServiceMaster
  selectedServiceNumber!: number;
  updateSelectedServiceNumber!: number
  updateSelectedServiceNumberRecord?: ServiceMaster
  shortText: string = '';
  updateShortText: string = '';
  shortTextChangeAllowed: boolean = false;
  updateShortTextChangeAllowed: boolean = false;

  recordsUnitOfMeasure: UnitOfMeasure[] = [];
  selectedUnitOfMeasure!: string;

  recordsMaterialGroup: MaterialGroup[] = [];
  selectedMaterialGroup!: string;

  recordsServiceType: ServiceType[] = [];
  selectedServiceType!: string;


  recordsLineType: LineType[] = [];
  selectedLineType: string = "Standard line";

  recordsCurrency!: any[];
  selectedCurrency!: string;
  //
  public rowIndex = 0;
  expandedRows: { [key: number]: boolean } = {};

  mainItemsRecords: MainItem[] = [];
  subItemsRecords: SubItem[] = [];

  constructor(private router: Router, private _ApiService: ApiService, private _ExecutionOrderService: ExecutionOrderService, private messageService: MessageService, private confirmationService: ConfirmationService) { }


  resizeTextarea(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
  
  ngOnInit() {
    this._ApiService.get<ServiceMaster[]>('servicenumbers').subscribe(response => {
      this.recordsServiceNumber = response
      //.filter(record => record.deletionIndicator === false);
    });
    this._ApiService.get<MaterialGroup[]>('materialgroups').subscribe(response => {
      this.recordsMaterialGroup = response
    });
    this._ApiService.get<ServiceType[]>('servicetypes').subscribe(response => {
      this.recordsServiceType = response
    });
    this._ApiService.get<LineType[]>('linetypes').subscribe(response => {
      this.recordsLineType = response
    });
    this._ApiService.get<any[]>('currencies').subscribe(response => {
      this.recordsCurrency = response;
    });
    this._ApiService.get<MainItem[]>('executionordermain').subscribe(response => {
      this.mainItemsRecords = response.sort((a, b) => a.executionOrderMainCode - b.executionOrderMainCode);
      console.log(this.mainItemsRecords);

      const filteredRecords = this.mainItemsRecords.filter(record => record.lineTypeCode != "Contingency line");

      this.totalValue = filteredRecords.reduce((sum, record) => sum + record.total, 0);
      console.log('Total Value:', this.totalValue);
    });
  }
  // Helper Functions:
  removePropertiesFrom(obj: any, propertiesToRemove: string[]): any {
    const newObj: any = {};

    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (Array.isArray(obj[key])) {
          // If the property is an array, recursively remove properties from each element
          newObj[key] = obj[key].map((item: any) => this.removeProperties(item, propertiesToRemove));
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          // If the property is an object, recursively remove properties from the object
          newObj[key] = this.removeProperties(obj[key], propertiesToRemove);
        } else if (!propertiesToRemove.includes(key)) {
          // Otherwise, copy the property if it's not in the list to remove
          newObj[key] = obj[key];
        }
      }
    }

    return newObj;
  }
  removeProperties(obj: any, propertiesToRemove: string[]): any {
    const newObj: any = {};
    Object.keys(obj).forEach(key => {
      if (!propertiesToRemove.includes(key)) {
        newObj[key] = obj[key];
      }
    });
    return newObj;
  }
  // to handel checkbox selection:
  selectedMainItem: MainItem | undefined;
  selectedMainItems: MainItem[] = [];
  selectedSubItems: SubItem[] = [];

  // onMainItemSelection(event: any, mainItem: MainItem) {
  //   mainItem.selected = event.checked;
  //   console.log(event.checked);

  //   console.log(this.selectedMainItems);

  //   if (mainItem.selected) {

  //     this.selectedMainItem = mainItem;

  //     console.log(this.selectedMainItem);

  //     this.selectedMainItems.push(mainItem);
  //     console.log(this.selectedMainItems);


  //     if (mainItem.executionOrdersubList && mainItem.executionOrdersubList.length > 0) {
  //       mainItem.executionOrdersubList.forEach(subItem => subItem.selected = !subItem.selected);
  //     }
  //   }
  //   else {
  //     this.selectedMainItem = undefined
  //     console.log("selected MainItem", this.selectedMainItem);


  //     const index = this.selectedMainItems.indexOf(mainItem);
  //     console.log(index);

  //     if (index !== -1) {
  //       this.selectedMainItems.splice(index, 1);
  //       console.log(this.selectedMainItems);
  //     }
  //     // User deselected the record, so we need to deselect all associated subitems
  //     if (mainItem.executionOrdersubList && mainItem.executionOrdersubList.length > 0) {
  //       mainItem.executionOrdersubList.forEach(subItem => subItem.selected = false)
  //       console.log(mainItem.executionOrdersubList);
  //     }
  //   }
  // }

  onMainItemSelection(event: any, mainItem: MainItem) {
    console.log('Event:', event);
    console.log('MainItem before change:', mainItem);

    console.log('Event checked state:', event.checked);
    console.log('MainItem selected before update:', mainItem.selected);

    mainItem.selected = event.checked;
    console.log('MainItem selected after update:', mainItem.selected);

    if (event.checked.length) {
      this.selectedMainItem = mainItem;
      console.log('Selected MainItem:', this.selectedMainItem);

      // Check if mainItem is already in the list to avoid duplication
      if (!this.selectedMainItems.includes(mainItem)) {
        this.selectedMainItems.push(mainItem);
        console.log('Selected Main Items after addition:', this.selectedMainItems);
      }

      if (mainItem.executionOrdersubList && mainItem.executionOrdersubList.length > 0) {
        mainItem.executionOrdersubList.forEach(subItem => subItem.selected = !subItem.selected);
        console.log('SubItems after selection:', mainItem.executionOrdersubList);
      }
    } else {
      console.log('Entering else block');
      this.selectedMainItem = undefined;
      console.log('Selected MainItem after deselection:', this.selectedMainItem);

      const index = this.selectedMainItems.indexOf(mainItem);
      console.log('Index of mainItem in selected list:', index);

      if (index !== -1) {
        this.selectedMainItems.splice(index, 1);
        console.log('Selected Main Items after removal:', this.selectedMainItems);
      }

      if (mainItem.executionOrdersubList && mainItem.executionOrdersubList.length > 0) {
        mainItem.executionOrdersubList.forEach(subItem => subItem.selected = false);
        console.log('SubItems after deselection:', mainItem.executionOrdersubList);
      }
    }
  }

  // to handle All Records Selection / Deselection 
  selectedAllRecords: MainItem[] = [];
  onSelectAllRecords(event: any): void {
    if (Array.isArray(event.checked) && event.checked.length > 0) {
      this.selectedAllRecords = [...this.mainItemsRecords];
      console.log(this.selectedAllRecords);
    } else {
      this.selectedAllRecords = [];
    }
  }

  onSubItemSelection(event: any, subItem: SubItem) {
    console.log(subItem);
    this.selectedSubItems.push(subItem);
  }
  //In Creation to handle shortTextChangeAlowlled Flag 
  onServiceNumberChange(event: any) {
    const selectedRecord = this.recordsServiceNumber.find(record => record.serviceNumberCode === this.selectedServiceNumber);
    if (selectedRecord) {
      this.selectedServiceNumberRecord = selectedRecord
      this.shortTextChangeAllowed = this.selectedServiceNumberRecord?.shortTextChangeAllowed || false;
      this.shortText = ""
    }
    else {
      console.log("no service number");
      //this.dontSelectServiceNumber = false
      this.selectedServiceNumberRecord = undefined;
    }
  }
  //In Update to handle shortTextChangeAlowlled Flag 
  onServiceNumberUpdateChange(event: any) {
    const updateSelectedRecord = this.recordsServiceNumber.find(record => record.serviceNumberCode === event.value);
    if (updateSelectedRecord) {
      this.updateSelectedServiceNumberRecord = updateSelectedRecord
      this.updateShortTextChangeAllowed = this.updateSelectedServiceNumberRecord?.shortTextChangeAllowed || false;
      this.updateShortText = ""
    }
    else {
      this.updateSelectedServiceNumberRecord = undefined;
    }
  }

  // expandAll() {
  //   this.mainItemsRecords.forEach(item => this.expandedRows[item.executionOrderMainCode] = true);
  // }
  // collapseAll() {
  //   this.expandedRows = {};
  // }

  // For Edit  MainItem
  clonedMainItem: { [s: number]: MainItem } = {};
  onMainItemEditInit(record: MainItem) {
    this.clonedMainItem[record.executionOrderMainCode] = { ...record };
  }
  onMainItemEditSave(index: number, record: MainItem) {
    console.log(record);

    const { executionOrderMainCode, total, ...mainItemWithoutMainItemCode } = record;
    const updatedMainItem = this.removePropertiesFrom(mainItemWithoutMainItemCode, ['executionOrderMainCode', 'executionOrderSubCode']);
    console.log(updatedMainItem);

    console.log(this.updateSelectedServiceNumber);
    if (this.updateSelectedServiceNumberRecord) {
      // (record?.subItems ?? []).map(subItem =>
      //   this.removeProperties(subItem, ['mainItemCode', 'subItemCode'])
      // )
      const newRecord: MainItem = {
        ...record, // Copy all properties from the original record
        // Modify specific attributes
        executionOrdersubList: (record?.executionOrdersubList ?? []).map(subItem =>
          this.removeProperties(subItem, ['executionOrderMainCode', 'executionOrderSubCode'])
        ),
        unitOfMeasurementCode: this.updateSelectedServiceNumberRecord.baseUnitOfMeasurement,
        description: this.updateSelectedServiceNumberRecord.description,
        materialGroupCode: this.updateSelectedServiceNumberRecord.materialGroupCode,
        serviceTypeCode: this.updateSelectedServiceNumberRecord.serviceTypeCode,
      };
      console.log(newRecord);
      this._ApiService.patch<MainItem>('executionordermain', record.executionOrderMainCode, newRecord).subscribe(response => {
        console.log('executionordermain updated:', response);
        if (response) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record is updated' });
        }
        else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid Data' });
        }
        // console.log(this.totalValue)
        this.totalValue = 0;
        this.ngOnInit()
      });
    }

    if (!this.updateSelectedServiceNumberRecord) {
      console.log({ ...mainItemWithoutMainItemCode });
      this._ApiService.patch<MainItem>('executionordermain', record.executionOrderMainCode, { ...updatedMainItem }).subscribe(response => {
        console.log('executionordermain updated:', response);
        if (response) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record is updated' });
        }
        else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid Data' });
        }
        this.totalValue = 0;
        //this.modelSpecDetailsService.getRecords();
        this.ngOnInit()
      });
    }
  }
  onMainItemEditCancel(row: MainItem, index: number) {
    this.mainItemsRecords[index] = this.clonedMainItem[row.executionOrderMainCode]
    delete this.clonedMainItem[row.executionOrderMainCode]
  }

  // For Edit  SubItem
  clonedSubItem: { [s: number]: SubItem } = {};
  onSubItemEditInit(record: SubItem) {
    if (record.executionOrderSubCode) {
      this.clonedSubItem[record.executionOrderSubCode] = { ...record };
    }
  }
  onSubItemEditSave(index: number, record: SubItem) {
    console.log(record);
    console.log(index);


    const { executionOrderSubCode, ...subItemWithoutSubItemCode } = record;

    console.log(this.updateSelectedServiceNumber);
    if (this.updateSelectedServiceNumberRecord) {
      const newRecord: SubItem = {
        ...record, // Copy all properties from the original record
        // Modify specific attributes
        unitOfMeasurementCode: this.updateSelectedServiceNumberRecord.baseUnitOfMeasurement,
        description: this.updateSelectedServiceNumberRecord.description,
        materialGroupCode: this.updateSelectedServiceNumberRecord.materialGroupCode,
        serviceTypeCode: this.updateSelectedServiceNumberRecord.serviceTypeCode,
      };
      console.log(newRecord);
      this._ApiService.patch<SubItem>('executionordersub', index, newRecord).subscribe(response => {
        console.log('executionordersub updated:', response);
        if (response) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record is updated' });
        }
        else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid Data' });
        }
        // console.log(this.totalValue)
        // this.totalValue = 0;
        this.ngOnInit()
      });
    }


    if (!this.updateSelectedServiceNumberRecord) {
      this._ApiService.patch<SubItem>('executionordersub', index, { ...subItemWithoutSubItemCode }).subscribe(response => {
        console.log('executionordersub updated:', response);
        if (response) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record is updated' });
        }
        else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid Data' });
        }
        //this.totalValue = 0;
        //this.modelSpecDetailsService.getRecords();
        this.ngOnInit()
      });
    }
  }
  onSubItemEditCancel(subItem: any, index: number) {
    // Check if subItem exists in clonedSubItems
    const originalItem = this.clonedSubItem[subItem.executionOrderSubCode];

    if (originalItem) {
      // Revert the item in the table to its original state
      this.mainItemsRecords.forEach(mainItem => {
        if (mainItem.executionOrdersubList && mainItem.executionOrdersubList[index] === subItem) {
          mainItem.executionOrdersubList[index] = { ...originalItem }; // Restore original item
        }
      });
      // Remove the item from clonedSubItems
      delete this.clonedSubItem[subItem.executionOrderSubCode];
    }

  }
  // onSubItemEditCancel(row: SubItem, index: number) {
  //   this.subItemsRecords[index] = this.clonedSubItem[row.executionOrderSubCode ? row.executionOrderSubCode : 0]
  //   delete this.clonedSubItem[row.executionOrderSubCode ? row.executionOrderSubCode : 0]
  // }

  // Delete MainItem || SubItem
  deleteRecord() {
    console.log("delete");
    if (this.selectedMainItems.length) {
      this.confirmationService.confirm({
        message: 'Are you sure you want to delete the selected record?',
        header: 'Confirm',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          for (const record of this.selectedMainItems) {
            console.log(record);
            this._ApiService.delete<MainItem>('executionordermain', record.executionOrderMainCode).subscribe(response => {
              console.log('executionordermain deleted :', response);
              this.totalValue = 0;
              this.ngOnInit();
            });
          }
          this.messageService.add({ severity: 'success', summary: 'Successfully', detail: 'Deleted', life: 3000 });
          this.selectedMainItems = []; // Clear the selectedRecords array after deleting all records
        }
      });
    }
    if (this.selectedSubItems.length) {
      this.confirmationService.confirm({
        message: 'Are you sure you want to delete the selected record?',
        header: 'Confirm',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          for (const record of this.selectedSubItems) {
            console.log(record);
            if (record.executionOrderSubCode) {
              this._ApiService.delete<SubItem>('executionordersub', record.executionOrderSubCode).subscribe(response => {
                console.log('executionordersub deleted :', response);
                //this.totalValue = 0;
                this.ngOnInit();
              });
            }

          }
          this.messageService.add({ severity: 'success', summary: 'Successfully', detail: 'Deleted', life: 3000 });
          this.selectedSubItems = []; // Clear the selectedRecords array after deleting all records
        }
      });
    }
  }


  // redirect to service-invoice:
  navigateServiceInvoice() {

    if (this.selectedMainItem) {
      const navigationExtras: NavigationExtras = {
        state: {
          Record: this.selectedMainItem
        }
      };
      console.log(navigationExtras);

      this.router.navigate(['/service-invoice'], navigationExtras);
    }

  }


  // For Add new  Main Item
  newMainItem: MainItem = {
    Type:'',
    executionOrderMainCode: 0,
    serviceNumberCode: 0,
    description: "",
    unitOfMeasurementCode: "",
    currencyCode: "",
    materialGroupCode: "",
    serviceTypeCode: "",
    personnelNumberCode: "",
    lineTypeCode: "",

    totalQuantity: 0,
    amountPerUnit: 0,
    total: 0,
    actualQuantity: 0,
    actualPercentage: 0,
    overFulfillmentPercentage: 0,
    unlimitedOverFulfillment: false,
    manualPriceEntryAllowed: false,
    externalServiceNumber: "",
    serviceText: "",
    lineText: "",
    lineNumber: "",

    biddersLine: false,
    supplementaryLine: false,
    lotCostOne: false,
    doNotPrint: false,


  };

  addMainItem() {
    if (!this.selectedServiceNumberRecord) { // if user didn't select serviceNumber 

      const newRecord = {
        unitOfMeasurementCode: this.selectedUnitOfMeasure,
        currencyCode: this.selectedCurrency,
        description: this.newMainItem.description,

        materialGroupCode: this.selectedMaterialGroup,
        serviceTypeCode: this.selectedServiceType,
        // lesa .....
        personnelNumberCode: this.newMainItem.personnelNumberCode,
        lineTypeCode: this.selectedLineType,

        totalQuantity: this.newMainItem.totalQuantity,
        amountPerUnit: this.newMainItem.amountPerUnit,
        total: this.newMainItem.total,
        actualQuantity: this.newMainItem.actualQuantity,
        actualPercentage: this.newMainItem.actualPercentage,

        overFulfillmentPercentage: this.newMainItem.overFulfillmentPercentage,
        unlimitedOverFulfillment: this.newMainItem.unlimitedOverFulfillment,
        manualPriceEntryAllowed: this.newMainItem.manualPriceEntryAllowed,
        externalServiceNumber: this.newMainItem.externalServiceNumber,
        serviceText: this.newMainItem.serviceText,
        lineText: this.newMainItem.lineText,
        lineNumber: this.newMainItem.lineNumber,

        biddersLine: this.newMainItem.biddersLine,
        supplementaryLine: this.newMainItem.supplementaryLine,
        lotCostOne: this.newMainItem.lotCostOne,
        doNotPrint: this.newMainItem.doNotPrint,
      }
      if (this.newMainItem.totalQuantity === 0 || this.newMainItem.description === "" || this.selectedCurrency === "") {
        // || this.newMainItem.unitOfMeasurementCode === ""  // till retrieved from cloud correctly
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Description & Quantity & Currency and UnitOfMeasurement are required',
          life: 3000
        });
      }
      else {
        console.log(newRecord);
        // Remove properties with empty or default values
        const filteredRecord = Object.fromEntries(
          Object.entries(newRecord).filter(([_, value]) => {
            return value !== '' && value !== 0 && value !== undefined && value !== null;
          })
        );
        console.log(filteredRecord);
        this._ApiService.post<MainItem>('executionordermain', filteredRecord).subscribe({
          next: (res) => {
            console.log('executionordermain created:', res);
            this.ngOnInit()
          }, error: (err) => {
            console.log(err);
          },
          complete: () => {
            this.resetNewMainItem();
            this.selectedUnitOfMeasure = "";
            this.selectedCurrency = "";
            this.selectedMaterialGroup = "";
            this.selectedServiceType = "";
            this.selectedLineType = "";

            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record added successfully ' });
            // this.ngOnInit()
          }
        });
        // this._ApiService.post<MainItem>('executionordermain', filteredRecord).subscribe((response: MainItem) => {
        //   console.log('executionordermain created:', response);
        //   if (response) {
        //     this.resetNewMainItem();
        //   }
        //   console.log(response);
        //   this.totalValue = 0;
        //   this.ngOnInit()
        // });
      }
    }

    else if (this.selectedServiceNumberRecord) { // if user select serviceNumber 
      const newRecord = {
        serviceNumberCode: this.selectedServiceNumber,
        unitOfMeasurementCode: this.selectedServiceNumberRecord?.baseUnitOfMeasurement,
        currencyCode: this.selectedCurrency,

        description: this.selectedServiceNumberRecord?.description,
        // lesa .....
        materialGroupCode: this.selectedServiceNumberRecord?.materialGroupCode,
        serviceTypeCode: this.selectedServiceNumberRecord?.serviceTypeCode,
        personnelNumberCode: this.newMainItem.personnelNumberCode,
        lineTypeCode: this.selectedLineType,

        totalQuantity: this.newMainItem.totalQuantity,
        amountPerUnit: this.newMainItem.amountPerUnit,
        total: this.newMainItem.total,
        actualQuantity: this.newMainItem.actualQuantity,
        actualPercentage: this.newMainItem.actualPercentage,

        overFulfillmentPercentage: this.newMainItem.overFulfillmentPercentage,
        unlimitedOverFulfillment: this.newMainItem.unlimitedOverFulfillment,
        manualPriceEntryAllowed: this.newMainItem.manualPriceEntryAllowed,
        externalServiceNumber: this.newMainItem.externalServiceNumber,
        serviceText: this.newMainItem.serviceText,
        lineText: this.newMainItem.lineText,
        lineNumber: this.newMainItem.lineNumber,

        biddersLine: this.newMainItem.biddersLine,
        supplementaryLine: this.newMainItem.supplementaryLine,
        lotCostOne: this.newMainItem.lotCostOne,
        doNotPrint: this.newMainItem.doNotPrint,
      }
      if (this.newMainItem.totalQuantity === 0 || this.selectedServiceNumberRecord.description === "" || this.selectedCurrency === "") {
        // || this.newMainItem.unitOfMeasurementCode === ""  // till retrieved from cloud correctly
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Description & Quantity & Currency and UnitOfMeasurement are required',
          life: 3000
        });
      }
      else {
        console.log(newRecord);
        // Remove properties with empty or default values
        const filteredRecord = Object.fromEntries(
          Object.entries(newRecord).filter(([_, value]) => {
            return value !== '' && value !== 0 && value !== undefined && value !== null;
          })
        );
        console.log(filteredRecord);
        this._ApiService.post<MainItem>('executionordermain', filteredRecord).subscribe({
          next: (res) => {
            console.log('executionordermain created:', res);
            this.ngOnInit()
          }, error: (err) => {
            console.log(err);
          },
          complete: () => {
            this.resetNewMainItem();
            this.selectedServiceNumberRecord = undefined;
            //this.selectedServiceNumber = 0;
            this.selectedLineType = "";
            this.selectedCurrency = ""
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record added successfully ' });
            //this.ngOnInit()
          }
        });

        // this._ApiService.post<MainItem>('executionordermain', filteredRecord).subscribe((response: MainItem) => {
        //   console.log('executionordermain created:', response);
        //   if (response) {
        //     this.resetNewMainItem();
        //     this.selectedServiceNumberRecord = undefined;
        //     this.selectedServiceNumber = 0;
        //     this.selectedLineType = "";
        //     this.selectedCurrency = ""
        //   }
        //   console.log(response);
        //   this.totalValue = 0;
        //   this.ngOnInit()
        // });
      }
    }
  }

  resetNewMainItem() {
    this.newMainItem = {
      Type:'',
      executionOrderMainCode: 0,
      serviceNumberCode: 0,
      description: "",
      unitOfMeasurementCode: "",
      currencyCode: "",
      materialGroupCode: "",
      serviceTypeCode: "",
      personnelNumberCode: "",
      lineTypeCode: "",

      totalQuantity: 0,
      amountPerUnit: 0,
      total: 0,
      actualQuantity: 0,
      actualPercentage: 0,
      overFulfillmentPercentage: 0,
      unlimitedOverFulfillment: false,
      manualPriceEntryAllowed: false,
      externalServiceNumber: "",
      serviceText: "",
      lineText: "",
      lineNumber: "",

      biddersLine: false,
      supplementaryLine: false,
      lotCostOne: false,
      doNotPrint: false,

      // subItems?:SubItem[]
    },
      this.selectedUnitOfMeasure = '';
    // this.selectedServiceNumber=0
  }



  // // For Add new  Sub Item
  // newSubItem: SubItem = {
  //   Type: '',

  //   executionOrderSubCode: 0,
  //   serviceNumberCode: 0,
  //   description: "",
  //   unitOfMeasurementCode: "",
  //   currencyCode: "",
  //   materialGroupCode: "",
  //   serviceTypeCode: "",
  //   personnelNumberCode: "",
  //   lineTypeCode: "",

  //   totalQuantity: 0,
  //   amountPerUnit: 0,
  //   total: 0,

  //   externalServiceNumber: "",
  //   serviceText: "",
  //   lineText: "",
  //   lineNumber: "",

  //   biddersLine: false,
  //   supplementaryLine: false,
  //   lotCostOne: false,
  //   doNotPrint: false,

  // };

  // addSubItem(mainItem: MainItem) {
  //   console.log(mainItem);
  //   if (!this.selectedServiceNumberRecord) { // if user didn't select serviceNumber

  //     const newRecord = {
  //       unitOfMeasurementCode: this.selectedUnitOfMeasure,
  //       currencyCode: this.selectedCurrency,
  //       description: this.newSubItem.description,

  //       materialGroupCode: this.selectedMaterialGroup,
  //       serviceTypeCode: this.selectedServiceType,
  //       personnelNumberCode: this.newSubItem.personnelNumberCode,
  //       lineTypeCode: this.selectedLineType,

  //       totalQuantity: this.newSubItem.totalQuantity,
  //       amountPerUnit: this.newSubItem.amountPerUnit,
  //       // total: this.newSubItem.total,

  //       externalServiceNumber: this.newSubItem.externalServiceNumber,
  //       serviceText: this.newSubItem.serviceText,
  //       lineText: this.newSubItem.lineText,
  //       lineNumber: this.newSubItem.lineNumber,

  //       biddersLine: this.newSubItem.biddersLine,
  //       supplementaryLine: this.newSubItem.supplementaryLine,
  //       lotCostOne: this.newSubItem.lotCostOne,
  //       doNotPrint: this.newSubItem.doNotPrint,
  //     }
  //     console.log(newRecord);

  //     const filteredSubItem = Object.fromEntries(
  //       Object.entries(newRecord).filter(([_, value]) => {
  //         return value !== '' && value !== 0 && value !== undefined && value !== null;
  //       })
  //     );
  //     console.log(filteredSubItem);

  //     const { executionOrderMainCode, total, ...mainItemWithoutMainItemCode } = mainItem;
  //     const updatedRecord: MainItem = {
  //       ...mainItemWithoutMainItemCode, // Copy all properties from the original record
  //       executionOrdersubList: [
  //         ...(mainItem?.executionOrdersubList ?? []).map(subItem =>
  //           this.removeProperties(subItem, ['executionOrderMainCode', 'executionOrderSubCode'])
  //         ),
  //         filteredSubItem
  //       ],
  //       executionOrderMainCode: 0,
  //       total: 0
  //     }
  //     console.log(updatedRecord.executionOrdersubList);

  //     if (this.newSubItem.totalQuantity === 0 || this.newSubItem.amountPerUnit === 0 || this.newSubItem.description == "" || this.selectedCurrency === "") {
  //       this.messageService.add({
  //         severity: 'error',
  //         summary: 'Error',
  //         detail: 'Quantity & AmountPerUnit & Description and Currency are required',
  //         life: 5000
  //       });
  //     }

  //     else {
  //       console.log(updatedRecord);
  //       // Remove properties with empty or default values
  //       const filteredRecord = Object.fromEntries(
  //         Object.entries(updatedRecord).filter(([_, value]) => {
  //           return value !== '' && value !== 0 && value !== undefined && value !== null;
  //         })
  //       );
  //       console.log(filteredRecord);

  //       this._ApiService.patch<MainItem>('executionordermain', mainItem.executionOrderMainCode, filteredRecord).subscribe({
  //         next: (res) => {
  //           console.log('executionordermain Updated && subItem Created:', res);
  //           this.ngOnInit()
  //         }, error: (err) => {
  //           console.log(err);
  //         },
  //         complete: () => {
  //           this.resetNewSubItem();
  //           this.selectedUnitOfMeasure = "";
  //           this.selectedCurrency = "";
  //           this.selectedMaterialGroup = "";
  //           this.selectedServiceType = "";
  //           this.selectedLineType = "";
  //           this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record added successfully ' });
  //           // this.ngOnInit()
  //         }
  //       });
  //     }
  //   }

  //   else if (this.selectedServiceNumberRecord) { // if user select serviceNumber 
  //     const newRecord = {
  //       serviceNumberCode: this.selectedServiceNumber,
  //       unitOfMeasurementCode: this.selectedServiceNumberRecord?.baseUnitOfMeasurement,
  //       currencyCode: this.selectedCurrency,
  //       description: this.selectedServiceNumberRecord?.description,

  //       materialGroupCode: this.selectedServiceNumberRecord?.materialGroupCode,
  //       serviceTypeCode: this.selectedServiceNumberRecord?.serviceTypeCode,
  //       personnelNumberCode: this.newSubItem.personnelNumberCode,
  //       lineTypeCode: this.selectedLineType,

  //       totalQuantity: this.newSubItem.totalQuantity,
  //       amountPerUnit: this.newSubItem.amountPerUnit,
  //       //total: this.newSubItem.total,

  //       externalServiceNumber: this.newSubItem.externalServiceNumber,
  //       serviceText: this.newSubItem.serviceText,
  //       lineText: this.newSubItem.lineText,
  //       lineNumber: this.newSubItem.lineNumber,

  //       biddersLine: this.newSubItem.biddersLine,
  //       supplementaryLine: this.newSubItem.supplementaryLine,
  //       lotCostOne: this.newSubItem.lotCostOne,
  //       doNotPrint: this.newSubItem.doNotPrint,
  //     }
  //     console.log(newRecord);
  //     const filteredSubItem = Object.fromEntries(
  //       Object.entries(newRecord).filter(([_, value]) => {
  //         return value !== '' && value !== 0 && value !== undefined && value !== null;
  //       })
  //     );
  //     console.log(filteredSubItem);
  //     const { executionOrderMainCode, total, ...mainItemWithoutMainItemCode } = mainItem;
  //     const updatedRecord: MainItem = {
  //       ...mainItemWithoutMainItemCode, // Copy all properties from the original record
  //       executionOrdersubList: [
  //         ...(mainItem?.executionOrdersubList ?? []).map(subItem =>
  //           this.removeProperties(subItem, ['executionOrderMainCode', 'executionOrderSubCode'])
  //         ),
  //         filteredSubItem
  //       ],
  //       executionOrderMainCode: 0,
  //       total: 0
  //     }
  //     console.log(updatedRecord.executionOrdersubList);
  //     console.log(updatedRecord);
  //     if (this.newSubItem.totalQuantity === 0 || this.newSubItem.amountPerUnit === 0 || this.selectedCurrency === "") {
  //       this.messageService.add({
  //         severity: 'error',
  //         summary: 'Error',
  //         detail: 'Quantity & AmountPerUnit and Currency are required',
  //         life: 5000
  //       });
  //     }
  //     else {
  //       // Remove properties with empty or default values
  //       const filteredRecord = Object.fromEntries(
  //         Object.entries(updatedRecord).filter(([_, value]) => {
  //           return value !== '' && value !== 0 && value !== undefined && value !== null;
  //         })
  //       );
  //       console.log(filteredRecord);

  //       this._ApiService.patch<MainItem>('executionordermain', mainItem.executionOrderMainCode, filteredRecord).subscribe({
  //         next: (res) => {
  //           console.log('executionordermain Updated && subItem Created:', res);
  //           this.ngOnInit()
  //         }, error: (err) => {
  //           console.log(err);
  //         },
  //         complete: () => {
  //           this.resetNewSubItem();
  //           this.selectedServiceNumberRecord = undefined;
  //           // this.selectedServiceNumber = 0;
  //           this.selectedLineType = "";
  //           this.selectedCurrency = ""
  //           this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record added successfully ' });
  //           //this.ngOnInit()
  //         }
  //       });
  //     }
  //   }
  // }

  // resetNewSubItem() {
  //   this.newSubItem = {
  //     Type: '',
  //     executionOrderSubCode: 0,
  //     serviceNumberCode: 0,
  //     description: "",
  //     unitOfMeasurementCode: "",
  //     currencyCode: "",
  //     materialGroupCode: "",
  //     serviceTypeCode: "",
  //     personnelNumberCode: "",
  //     lineTypeCode: "",

  //     totalQuantity: 0,
  //     amountPerUnit: 0,
  //     total: 0,

  //     externalServiceNumber: "",
  //     serviceText: "",
  //     lineText: "",
  //     lineNumber: "",

  //     biddersLine: false,
  //     supplementaryLine: false,
  //     lotCostOne: false,
  //     doNotPrint: false,
  //   },
  //     this.selectedUnitOfMeasure = '';
  // }
  
  // Export to excel sheet:
  transformData(data: MainItem[]) {
    const transformed: MainItem[] = []

    data.forEach((mainItem) => {
      transformed.push({
        Type: 'Main Item',
        serviceNumberCode: mainItem.serviceNumberCode,
        description: mainItem.description,
        totalQuantity: mainItem.totalQuantity,
        unitOfMeasurementCode: mainItem.unitOfMeasurementCode,
        amountPerUnit: mainItem.amountPerUnit,
        currencyCode: mainItem.currencyCode,
        total: mainItem.total,
        actualQuantity: mainItem.actualQuantity,
        actualPercentage: mainItem.actualPercentage,
        overFulfillmentPercentage: mainItem.overFulfillmentPercentage,
        unlimitedOverFulfillment: mainItem.unlimitedOverFulfillment,
        manualPriceEntryAllowed: mainItem.manualPriceEntryAllowed,
        materialGroupCode: mainItem.materialGroupCode,
        serviceTypeCode: mainItem.serviceTypeCode,
        externalServiceNumber: mainItem.externalServiceNumber,
        serviceText: mainItem.serviceText,
        lineText: mainItem.lineText,
        personnelNumberCode: mainItem.personnelNumberCode,
        lineTypeCode: mainItem.lineTypeCode,
        lineNumber: mainItem.lineNumber,
        biddersLine: mainItem.biddersLine,
        supplementaryLine: mainItem.supplementaryLine,
        lotCostOne: mainItem.lotCostOne,

        doNotPrint: mainItem.doNotPrint,
        executionOrderMainCode: mainItem.executionOrderMainCode
      });

      // Add subitems
      mainItem.executionOrdersubList?.forEach(subItem => {
        transformed.push({
          Type: 'Sub Item',
          serviceNumberCode: subItem.serviceNumberCode || mainItem.serviceNumberCode,
          description: subItem.description || mainItem.description,
          totalQuantity: subItem.totalQuantity,

          unitOfMeasurementCode: subItem.unitOfMeasurementCode || mainItem.unitOfMeasurementCode,
          amountPerUnit: subItem.amountPerUnit,
          currencyCode: subItem.currencyCode || mainItem.currencyCode,
          total: subItem.total,
          // actualQuantity: mainItem.actualQuantity,
          // actualPercentage: mainItem.actualPercentage,

          // overFulfillmentPercentage: mainItem.overFulfillmentPercentage,
          // unlimitedOverFulfillment: mainItem.unlimitedOverFulfillment,
          // manualPriceEntryAllowed: mainItem.manualPriceEntryAllowed,
          materialGroupCode: subItem.materialGroupCode || mainItem.materialGroupCode,
          serviceTypeCode: subItem.serviceTypeCode || mainItem.serviceTypeCode,
          externalServiceNumber: subItem.externalServiceNumber || mainItem.externalServiceNumber,
          serviceText: subItem.serviceText || mainItem.serviceText,
          lineText: subItem.lineText || mainItem.lineText,
          personnelNumberCode: subItem.personnelNumberCode || mainItem.personnelNumberCode,
          lineTypeCode: subItem.lineTypeCode || mainItem.lineTypeCode,

          lineNumber: subItem.lineNumber || mainItem.lineNumber,
          biddersLine: subItem.biddersLine || mainItem.biddersLine,
          supplementaryLine: subItem.supplementaryLine || mainItem.supplementaryLine,
          lotCostOne: subItem.lotCostOne || mainItem.lotCostOne,
          doNotPrint: mainItem.doNotPrint,
          executionOrderMainCode: mainItem.executionOrderMainCode
        });
      });
    });

    return transformed;
  }

  exportExcel() {
    import('xlsx').then((xlsx) => {
      const transformedData = this.transformData(this.mainItemsRecords);
      const worksheet = xlsx.utils.json_to_sheet(transformedData);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const ws = workbook.Sheets.data;
      if (!ws['!ref']) {
        ws['!ref'] = 'A1:Z1000';
      }
      const range = xlsx.utils.decode_range(ws['!ref']);
      let rowStart = 1;

      transformedData.forEach((row, index) => {
        if (row.Type === 'Main Item') {

          if (index + 1 < transformedData.length && transformedData[index + 1].Type === 'Sub Item') {
            ws['!rows'] = ws['!rows'] || [];
            ws['!rows'][index] = { hidden: false };
            ws['!rows'][index + 1] = { hidden: false };
          } else {
            ws['!rows'] = ws['!rows'] || [];
            ws['!rows'][index] = { hidden: false };
          }
        } else {
          ws['!rows'] = ws['!rows'] || [];
          ws['!rows'][index] = { hidden: false };
        }
      });

      const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveAsExcelFile(excelBuffer, 'Execution Order');
    });
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    let EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    let EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE
    });
    FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
  }

}
